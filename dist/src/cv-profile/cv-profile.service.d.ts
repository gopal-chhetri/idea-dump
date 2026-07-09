import { EntityManager } from '@mikro-orm/postgresql';
import { CvProfile } from '../entities/cv-profile.entity';
import { CvSkill } from '../entities/cv-skill.entity';
import { SkillCategory } from '../entities/enums';
export declare class CvProfileService {
    private readonly em;
    constructor(em: EntityManager);
    getProfile(userId: string): Promise<CvProfile | null>;
    upsertProfile(userId: string, summaryText: string): Promise<CvProfile>;
    addSkill(userId: string, name: string, category: SkillCategory, weight?: number): Promise<CvSkill>;
    removeSkill(userId: string, skillId: string): Promise<void>;
}
