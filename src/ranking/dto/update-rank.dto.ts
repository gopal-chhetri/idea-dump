import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsBoolean, IsOptional } from 'class-validator';

export class UpdateRankDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'Force this idea to a specific position in the ranked list (1 = top). Set to null to remove override.',
  })
  @IsInt()
  @IsOptional()
  manualRank?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Pin this idea to always appear at the very top, above all other ranked ideas.',
  })
  @IsBoolean()
  @IsOptional()
  pinned?: boolean;
}
