import { Collection, OptionalProps } from '@mikro-orm/core';
import { Idea } from './idea.entity';
export declare class IdeaStatus {
    [OptionalProps]?: 'id' | 'label' | 'sortOrder' | 'isDefault' | 'createdAt' | 'ideas';
    id: string;
    value: string;
    label?: string;
    sortOrder: number;
    isDefault: boolean;
    createdAt: Date;
    ideas: Collection<Idea, object>;
}
