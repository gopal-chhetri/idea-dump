import { Injectable } from '@nestjs/common';
import { ScoringStrategy, ScoringResult } from './scoring-strategy.interface';
import { Idea } from '../../entities/idea.entity';
import { CvProfile } from '../../entities/cv-profile.entity';
import { CvSkill } from '../../entities/cv-skill.entity';

@Injectable()
export class RuleBasedScoringStrategy implements ScoringStrategy {
  score(
    idea: Idea,
    profile: CvProfile,
    userIdeas: Idea[],
  ): Promise<ScoringResult> {
    const fitScore = this.computeFitScore(idea, profile);
    const effortScore = this.computeEffortScore(idea);
    const noveltyScore = this.computeNoveltyScore(idea, userIdeas);

    return Promise.resolve({ fitScore, effortScore, noveltyScore });
  }

  // ── Fit: overlap between idea text and CV skills ──────

  private computeFitScore(idea: Idea, profile: CvProfile): number {
    const skills: CvSkill[] = profile.skills?.getItems() ?? [];
    if (skills.length === 0) return 50; // Neutral if no CV

    const ideaTokens = this.tokenize(
      `${idea.description} ${idea.features.join(' ')} ${idea.useCase}`,
    );

    if (ideaTokens.size === 0) return 0;

    let weightedMatches = 0;
    let maxPossibleWeight = 0;

    for (const skill of skills) {
      maxPossibleWeight += skill.weight;
      const skillTokens = this.tokenize(skill.name);
      for (const st of skillTokens) {
        if (ideaTokens.has(st)) {
          weightedMatches += skill.weight;
          break; // Count each skill once
        }
      }
    }

    if (maxPossibleWeight === 0) return 50;
    return Math.round((weightedMatches / maxPossibleWeight) * 100);
  }

  // ── Effort: heuristic from feature count + description length ──

  private computeEffortScore(idea: Idea): number {
    const featureCount = idea.features.length;
    const descLength = idea.description.length;

    // More features + longer description → lower effort score (more effort)
    // Scale: 0 features, short desc → 100 (easy); 10+ features, 2000+ chars → 0 (hard)
    const featurePenalty = Math.min(featureCount * 10, 60);
    const lengthPenalty = Math.min(Math.floor(descLength / 50), 40);

    return Math.max(0, 100 - featurePenalty - lengthPenalty);
  }

  // ── Novelty: Jaccard distance from user's other ideas ──

  private computeNoveltyScore(idea: Idea, userIdeas: Idea[]): number {
    const otherIdeas = userIdeas.filter((i) => i.id !== idea.id);
    if (otherIdeas.length === 0) return 100; // First idea is maximally novel

    const ideaTokens = this.tokenize(
      `${idea.title} ${idea.description} ${idea.features.join(' ')} ${idea.useCase}`,
    );

    if (ideaTokens.size === 0) return 100;

    // Average Jaccard distance against all other ideas
    let totalDistance = 0;

    for (const other of otherIdeas) {
      const otherTokens = this.tokenize(
        `${other.title} ${other.description} ${other.features.join(' ')} ${other.useCase}`,
      );

      const intersection = new Set(
        [...ideaTokens].filter((t) => otherTokens.has(t)),
      );
      const union = new Set([...ideaTokens, ...otherTokens]);

      const jaccard = union.size > 0 ? intersection.size / union.size : 0;
      totalDistance += 1 - jaccard;
    }

    return Math.round((totalDistance / otherIdeas.length) * 100);
  }

  // ── Tokenizer ─────────────────────────────────────────

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1),
    );
  }
}
