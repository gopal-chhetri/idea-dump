import { Inject, Injectable } from '@nestjs/common';
import { score, TypeSafeClient } from '@typesafe-ai/sdk';
import { ScoringStrategy, ScoringResult } from './scoring-strategy.interface';
import { Idea } from '../../entities/idea.entity';
import { CvSkill } from '../../entities/cv-skill.entity';

/** DI token for the TypeSafe client; null when no API key is configured. */
export const TYPESAFE_CLIENT = 'TYPESAFE_CLIENT';

const MAX_SUMMARY_CHARS = 2000;
const MAX_OTHER_IDEAS = 30;

// Each rubric is ordered from 0 upwards. Jev returns the expected position,
// which can fall between levels, and toPercent maps it onto 0-100.
const FIT_RUBRIC = [
  "No overlap with the developer's skills",
  'Touches one or two of their skills',
  'Partly matches their skills; some new areas to learn',
  'Mostly matches their skills',
  "Uses the developer's strongest skills almost entirely",
] as const;

const EFFORT_RUBRIC = [
  'A weekend',
  '1-2 weeks',
  'About a month',
  'Several months',
  'A multi-person project',
] as const;

const NOVELTY_RUBRIC = [
  'Essentially duplicates one of their other ideas',
  'Closely overlaps another idea',
  'Shares a theme with other ideas but differs in substance',
  'Mostly distinct from their other ideas',
  'Unlike anything else in the list',
] as const;

function toPercent(expected: number, rubricLength: number): number {
  const pct = (expected / (rubricLength - 1)) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/**
 * Scores an idea with Jev (TypeSafe's System One model): fit against the
 * developer's CV, effort to build, and novelty against their other ideas,
 * each on an ordered rubric. One API call per idea.
 */
@Injectable()
export class JevScoringStrategy implements ScoringStrategy {
  constructor(
    @Inject(TYPESAFE_CLIENT) private readonly client: TypeSafeClient | null,
  ) {}

  get enabled(): boolean {
    return this.client !== null;
  }

  async score(
    idea: Idea,
    skills: CvSkill[],
    userIdeas: Idea[],
    cvSummary = '',
  ): Promise<ScoringResult> {
    if (!this.client) {
      throw new Error('Jev scoring is not configured (TYPESAFE_API_KEY)');
    }

    const { answers } = await this.client.systemOne({
      state: {
        idea: {
          title: idea.title,
          description: idea.description,
          features: idea.features,
          useCase: idea.useCase,
        },
        developer: {
          skills: skills.map((s) => ({
            name: s.name,
            category: s.category,
            proficiency: `${s.weight}/5`,
          })),
          cvSummary: cvSummary.slice(0, MAX_SUMMARY_CHARS),
        },
        otherIdeaTitles: userIdeas
          .filter((i) => i.id !== idea.id)
          .slice(0, MAX_OTHER_IDEAS)
          .map((i) => i.title),
      },
      questions: {
        fit: score(
          "How well do the developer's skills match what this idea needs?",
          FIT_RUBRIC,
        ),
        effort: score(
          'How much work would it take one developer to build this idea?',
          EFFORT_RUBRIC,
        ),
        novelty: score(
          "How different is this idea from the developer's other ideas?",
          NOVELTY_RUBRIC,
        ),
      },
    });

    return {
      fitScore: toPercent(answers.fit.score, FIT_RUBRIC.length),
      effortScore: toPercent(answers.effort.score, EFFORT_RUBRIC.length),
      noveltyScore: toPercent(answers.novelty.score, NOVELTY_RUBRIC.length),
      // The weakest answer bounds how much we trust the combined score.
      confidence: Math.min(
        answers.fit.confidence,
        answers.effort.confidence,
        answers.novelty.confidence,
      ),
    };
  }
}
