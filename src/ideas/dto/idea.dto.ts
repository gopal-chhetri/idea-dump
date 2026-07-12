import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateIdeaDto {
  @ApiProperty({
    example: 'AI-powered Code Review Bot',
    description: 'Short, memorable idea title',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    example:
      'A GitHub App that uses LLMs to perform contextual code review, flag bugs, and suggest improvements.',
    description: 'Full problem statement and value proposition',
  })
  @IsString()
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
  features?: string[];

  @ApiProperty({
    example:
      'Software teams wanting automated, AI-assisted code review without switching tools.',
    description:
      'Who benefits and how this demonstrates engineering capability',
  })
  @IsString()
  useCase!: string;
}

export class UpdateIdeaDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description text' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['Feature A', 'Feature B'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: 'Updated use case description' })
  @IsString()
  @IsOptional()
  useCase?: string;

  @ApiPropertyOptional({
    example: 'in_progress',
    description:
      'Workflow status value of the idea (draft, in_progress, completed, archived)',
  })
  @IsString()
  @IsOptional()
  status?: string;
}
