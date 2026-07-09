import { Collection, OptionalProps } from '@mikro-orm/core';
import { User } from './user.entity';
import { CvSkill } from './cv-skill.entity';
export declare class CvProfile {
    [OptionalProps]?: 'id' | 'summaryText' | 'updatedAt' | 'skills';
    id: string;
    user: User;
    summaryText: string;
    updatedAt: Date;
    skills: Collection<CvSkill, object>;
}
