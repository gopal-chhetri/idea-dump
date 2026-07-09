import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { IdeaScore } from '../entities/idea-score.entity';
import { CvProfile } from '../entities/cv-profile.entity';
import { ScoringMethod } from '../entities/enums';
import { RuleBasedScoringStrategy } from './strategies/rule-based-scoring.strategy';

@Injectable()
export class ScoringService {
  private readonly wFit: number;
  private readonly wEffort: number;
  private readonly wNovelty: number;

  constructor(
    private readonly em: EntityManager,
    private readonly ruleBasedStrategy: RuleBasedScoringStrategy,
  ) {
    this.wFit = Number(process.env.SCORE_WEIGHT_FIT) || 0.5;
    this.wEffort = Number(process.env.SCORE_WEIGHT_EFFORT) || 0.3;
    this.wNovelty = Number(process.env.SCORE_WEIGHT_NOVELTY) || 0.2;
  }

  async scoreIdea(ideaId: string, userId: string): Promise<IdeaScore> {
    const idea = await this.em.findOne(Idea, { id: ideaId });
    if (!idea) throw new NotFoundException('Idea not found');

    // Load user's CV profile with skills
    const profile = await this.em.findOne(
      CvProfile,
      { user: userId },
      { populate: ['skills'] },
    );

    // Load all user ideas for novelty calculation
    const userIdeas = await this.em.find(Idea, { user: userId });

    // If no CV profile, create a minimal one for scoring
    const scoringProfile =
      profile ??
      this.em.create(CvProfile, {
        user: userId,
        summaryText: '',
      } as never);

    const result = await this.ruleBasedStrategy.score(
      idea,
      scoringProfile,
      userIdeas,
    );

    // Aggregate: final = w1*fit + w2*(100-effort) + w3*novelty
    const finalScore =
      this.wFit * result.fitScore +
      this.wEffort * (100 - result.effortScore) +
      this.wNovelty * result.noveltyScore;

    // Upsert score for this scoring method
    let ideaScore = await this.em.findOne(IdeaScore, {
      idea: ideaId,
      scoringMethod: ScoringMethod.RULE_BASED,
    });

    if (ideaScore) {
      ideaScore.fitScore = result.fitScore;
      ideaScore.effortScore = result.effortScore;
      ideaScore.noveltyScore = result.noveltyScore;
      ideaScore.finalScore = finalScore;
      ideaScore.scoredAt = new Date();
    } else {
      ideaScore = this.em.create(IdeaScore, {
        idea,
        fitScore: result.fitScore,
        effortScore: result.effortScore,
        noveltyScore: result.noveltyScore,
        finalScore,
        scoringMethod: ScoringMethod.RULE_BASED,
      });
      this.em.persist(ideaScore);
    }

    await this.em.flush();
    return ideaScore;
  }
}
