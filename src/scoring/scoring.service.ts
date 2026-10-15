import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { IdeaScore } from '../entities/idea-score.entity';
import { CvProfile } from '../entities/cv-profile.entity';
import { ScoringMethod } from '../entities/enums';
import { RuleBasedScoringStrategy } from './strategies/rule-based-scoring.strategy';
import { JevScoringStrategy } from './strategies/jev-scoring.strategy';
import { ScoringResult } from './strategies/scoring-strategy.interface';
import { primaryScore } from './primary-score';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly wFit: number;
  private readonly wEffort: number;
  private readonly wNovelty: number;

  constructor(
    private readonly em: EntityManager,
    private readonly ruleBasedStrategy: RuleBasedScoringStrategy,
    private readonly jevStrategy: JevScoringStrategy,
  ) {
    this.wFit = Number(process.env.SCORE_WEIGHT_FIT) || 0.5;
    this.wEffort = Number(process.env.SCORE_WEIGHT_EFFORT) || 0.3;
    this.wNovelty = Number(process.env.SCORE_WEIGHT_NOVELTY) || 0.2;
  }

  /**
   * Scores an idea. The rule-based score is always saved (fast, offline);
   * when Jev is configured a Jev score is saved alongside it. Jev failures
   * are logged and never fail the request. Returns the score used for
   * ranking.
   */
  async scoreIdea(ideaId: string, userId: string): Promise<IdeaScore> {
    const idea = await this.em.findOne(Idea, { id: ideaId });
    if (!idea) throw new NotFoundException('Idea not found');

    const profile = await this.em.findOne(
      CvProfile,
      { user: userId },
      { populate: ['skills'] },
    );
    const skills = profile?.skills.getItems() ?? [];
    // All of the user's ideas, for novelty.
    const userIdeas = await this.em.find(Idea, { user: userId });

    const scores = [
      await this.upsertScore(
        idea,
        ScoringMethod.RULE_BASED,
        await this.ruleBasedStrategy.score(idea, skills, userIdeas),
      ),
    ];

    if (this.jevStrategy.enabled) {
      try {
        const result = await this.jevStrategy.score(
          idea,
          skills,
          userIdeas,
          profile?.summaryText ?? '',
        );
        scores.push(await this.upsertScore(idea, ScoringMethod.LLM, result));
      } catch (err) {
        this.logger.warn(
          `Jev scoring failed for idea ${idea.id}, using rule-based score: ${String(err)}`,
        );
      }
    }

    await this.em.flush();
    return primaryScore(scores) ?? scores[0];
  }

  private async upsertScore(
    idea: Idea,
    method: ScoringMethod,
    result: ScoringResult,
  ): Promise<IdeaScore> {
    // final = w1*fit + w2*(100-effort) + w3*novelty
    const finalScore =
      this.wFit * result.fitScore +
      this.wEffort * (100 - result.effortScore) +
      this.wNovelty * result.noveltyScore;

    const existing = await this.em.findOne(IdeaScore, {
      idea: idea.id,
      scoringMethod: method,
    });
    if (existing) {
      existing.fitScore = result.fitScore;
      existing.effortScore = result.effortScore;
      existing.noveltyScore = result.noveltyScore;
      existing.finalScore = finalScore;
      existing.confidence = result.confidence;
      existing.scoredAt = new Date();
      return existing;
    }

    const created = this.em.create(IdeaScore, {
      idea,
      fitScore: result.fitScore,
      effortScore: result.effortScore,
      noveltyScore: result.noveltyScore,
      finalScore,
      confidence: result.confidence,
      scoringMethod: method,
    });
    this.em.persist(created);
    return created;
  }
}
