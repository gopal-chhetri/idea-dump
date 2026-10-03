import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  MaxLength,
  ArrayMaxSize,
  IsNotEmpty,
} from 'class-validator';

export class CreateIdeaDto {
  @ApiProperty({
    example: 'AI-powered Code Review Bot',
    description: 'Short, memorable idea title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example:
      'A GitHub App that uses LLMs to perform contextual code review, flag bugs, and suggest improvements.',
    description: 'Full problem statement and value proposition',
  })
  @IsString()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({
    example: [
      'PR diff analysis',
      'LLM integration',
      'GitHub Actions',
      'Rate limiting',
    ],
    description: 'Key features or capabilities (comma-separated in UI)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  features?: string[];

  @ApiProperty({
    example:
      'Software teams wanting automated, AI-assisted code review without switching tools.',
    description:
      'Who benefits and how this demonstrates engineering capability',
  })
  @IsString()
  @MaxLength(5000)
  useCase!: string;

  @ApiPropertyOptional({
    example: 'in_progress',
    description:
      'Workflow status value of the idea (draft, in_progress, completed, archived)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;
}

export class UpdateIdeaDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description text' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['Feature A', 'Feature B'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @MaxLength(100, { each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 'Updated use case description' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  useCase?: string;

  @ApiPropertyOptional({
    example: 'in_progress',
    description:
      'Workflow status value of the idea (draft, in_progress, completed, archived)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  status?: string;
}
