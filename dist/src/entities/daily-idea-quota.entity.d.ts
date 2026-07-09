import { OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';
export declare class DailyIdeaQuota {
    [OptionalProps]?: 'id' | 'count';
    id: string;
    user: User;
    date: string;
    count: number;
}
