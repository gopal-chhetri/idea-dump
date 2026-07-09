import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { IdeaRankOverride } from '../entities/idea-rank-override.entity';
export declare class RankingService {
    private readonly em;
    constructor(em: EntityManager);
    getRankedIdeas(userId: string): Promise<Idea[]>;
    setOverride(userId: string, ideaId: string, data: {
        manualRank?: number;
        pinned?: boolean;
    }): Promise<IdeaRankOverride>;
    clearOverride(userId: string, ideaId: string): Promise<void>;
    private getLatestFinalScore;
    private assertOwnership;
}
