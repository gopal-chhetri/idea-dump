import { OptionalProps } from '@mikro-orm/core';
import { Idea } from './idea.entity';
import { ScoringMethod } from './enums';
export declare class IdeaScore {
    [OptionalProps]?: 'id' | 'scoredAt';
    id: string;
    idea: Idea;
    fitScore: number;
    effortScore: number;
    noveltyScore: number;
    finalScore: number;
    scoringMethod: ScoringMethod;
    scoredAt: Date;
}
