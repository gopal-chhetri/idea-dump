import { SkillCategory } from '../../entities/enums';
export declare class UpdateCvProfileDto {
    summaryText: string;
}
export declare class CreateCvSkillDto {
    name: string;
    category: SkillCategory;
    weight?: number;
}
