import { Collection, OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';
import { IdeaStatus } from './idea-status.entity';
import { IdeaScore } from './idea-score.entity';
import { IdeaRankOverride } from './idea-rank-override.entity';
export declare class Idea {
    [OptionalProps]?: 'id' | 'features' | 'createdAt' | 'scores' | 'rankOverride';
    id: string;
    user: User;
    title: string;
    description: string;
    features: string[];
    useCase: string;
    status: IdeaStatus;
    createdAt: Date;
    scores: Collection<IdeaScore, object>;
    rankOverride?: IdeaRankOverride;
}
