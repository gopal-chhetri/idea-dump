import { OptionalProps } from '@mikro-orm/core';
import { Idea } from './idea.entity';
export declare class IdeaRankOverride {
    [OptionalProps]?: 'id' | 'manualRank' | 'pinned' | 'setAt';
    id: string;
    idea: Idea;
    manualRank?: number;
    pinned: boolean;
    setAt: Date;
}
