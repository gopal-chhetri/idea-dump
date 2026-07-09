import { EntityManager } from '@mikro-orm/postgresql';
import { IdeaScore } from '../entities/idea-score.entity';
import { RuleBasedScoringStrategy } from './strategies/rule-based-scoring.strategy';
export declare class ScoringService {
    private readonly em;
    private readonly ruleBasedStrategy;
    private readonly wFit;
    private readonly wEffort;
    private readonly wNovelty;
    constructor(em: EntityManager, ruleBasedStrategy: RuleBasedScoringStrategy);
    scoreIdea(ideaId: string, userId: string): Promise<IdeaScore>;
}
