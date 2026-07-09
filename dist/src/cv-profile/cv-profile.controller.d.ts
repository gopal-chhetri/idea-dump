import type { Request } from 'express';
import { CvProfileService } from './cv-profile.service';
import { UpdateCvProfileDto, CreateCvSkillDto } from './dto/cv-profile.dto';
export declare class CvProfileController {
    private readonly cvProfileService;
    constructor(cvProfileService: CvProfileService);
    getProfile(req: Request): Promise<import("../entities").CvProfile | null>;
    upsertProfile(req: Request, dto: UpdateCvProfileDto): Promise<import("../entities").CvProfile>;
    addSkill(req: Request, dto: CreateCvSkillDto): Promise<import("../entities").CvSkill>;
    removeSkill(req: Request, skillId: string): Promise<void>;
}
