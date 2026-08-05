import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { SkillCategory } from '../../entities/enums';

export class UpdateCvProfileDto {
  @ApiProperty({
    example:
      'Full-stack engineer with 5 years of experience in TypeScript, NestJS, and PostgreSQL. Strong focus on distributed systems and DevOps.',
    description:
      'Free-text professional summary used to calibrate idea fit scoring',
  })
  @IsString()
  summaryText!: string;
}

export class CreateCvSkillDto {
  @ApiProperty({
    example: 'TypeScript',
    description: 'Skill or technology name',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    enum: SkillCategory,
    example: SkillCategory.LANGUAGE,
    description: 'Skill category: language, framework, tool, or domain',
  })
  @IsEnum(SkillCategory)
  category!: SkillCategory;

  @ApiPropertyOptional({
    example: 4,
    minimum: 1,
    maximum: 5,
    description:
      'Proficiency / relevance weight (1 = basic familiarity, 5 = expert)',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  weight?: number;
}
