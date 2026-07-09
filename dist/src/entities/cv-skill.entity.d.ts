import { OptionalProps } from '@mikro-orm/core';
import { CvProfile } from './cv-profile.entity';
import { SkillCategory } from './enums';
export declare class CvSkill {
    [OptionalProps]?: 'id' | 'weight';
    id: string;
    cvProfile: CvProfile;
    name: string;
    category: SkillCategory;
    weight: number;
}
