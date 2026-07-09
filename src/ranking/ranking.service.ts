import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager, raw } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { IdeaRankOverride } from '../entities/idea-rank-override.entity';
import { IdeaScore } from '../entities/idea-score.entity';
import { ScoringMethod } from '../entities/enums';

@Injectable()
export class RankingService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Returns user's ideas ordered by:
   *   pinned DESC, manual_rank ASC NULLS LAST, final_score DESC
   */
  async getRankedIdeas(userId: string): Promise<Idea[]> {
    // Load all ideas with scores and overrides
    const ideas = await this.em.find(
      Idea,
      { user: userId },
      { populate: ['scores', 'rankOverride'] },
    );

    // Sort in application code to match the spec
    return ideas.sort((a, b) => {
      const aPinned = a.rankOverride?.pinned ? 1 : 0;
      const bPinned = b.rankOverride?.pinned ? 1 : 0;

      // Pinned first
      if (bPinned !== aPinned) return bPinned - aPinned;

      // Manual rank ASC (nulls last)
      const aRank = a.rankOverride?.manualRank ?? Infinity;
      const bRank = b.rankOverride?.manualRank ?? Infinity;
      if (aRank !== bRank) return aRank - bRank;

      // Final score DESC
      const aScore = this.getLatestFinalScore(a);
      const bScore = this.getLatestFinalScore(b);
      return bScore - aScore;
    });
  }

  async setOverride(
    userId: string,
    ideaId: string,
    data: { manualRank?: number; pinned?: boolean },
  ): Promise<IdeaRankOverride> {
    const idea = await this.em.findOne(
      Idea,
      { id: ideaId },
      { populate: ['rankOverride'] },
    );
    if (!idea) throw new NotFoundException('Idea not found');
    this.assertOwnership(idea, userId);

    let override = idea.rankOverride;

    if (override) {
      if (data.manualRank !== undefined) override.manualRank = data.manualRank;
      if (data.pinned !== undefined) override.pinned = data.pinned;
      override.setAt = new Date();
    } else {
      override = this.em.create(IdeaRankOverride, {
        idea,
        manualRank: data.manualRank,
        pinned: data.pinned ?? false,
      });
      this.em.persist(override);
    }

    await this.em.flush();
    return override;
  }

  async clearOverride(userId: string, ideaId: string): Promise<void> {
    const idea = await this.em.findOne(
      Idea,
      { id: ideaId },
      { populate: ['rankOverride'] },
    );
    if (!idea) throw new NotFoundException('Idea not found');
    this.assertOwnership(idea, userId);

    if (idea.rankOverride) {
      this.em.remove(idea.rankOverride);
      await this.em.flush();
    }
  }

  // ── Helpers ─────────────────────────────────────────────

  private getLatestFinalScore(idea: Idea): number {
    const scores = idea.scores?.getItems() ?? [];
    // Prefer rule_based score
    const ruleScore = scores.find(
      (s) => s.scoringMethod === ScoringMethod.RULE_BASED,
    );
    return ruleScore?.finalScore ?? 0;
  }

  private assertOwnership(idea: Idea, userId: string): void {
    const ideaUserId = typeof idea.user === 'string' ? idea.user : idea.user.id;
    if (ideaUserId !== userId) {
      throw new ForbiddenException('Not your idea');
    }
  }
}
