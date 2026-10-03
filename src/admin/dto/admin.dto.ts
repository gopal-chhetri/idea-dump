import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/enums';

const ROLES = Object.values(UserRole);

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 20;
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Initial password (min 8 chars). Omit for OAuth-only users.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: ROLES, default: UserRole.USER })
  @IsIn(ROLES)
  @IsOptional()
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: ROLES })
  @IsIn(ROLES)
  @IsOptional()
  role?: UserRole;
}

export class UpsertSettingDto {
  @ApiProperty({ example: 'OPENAI_API_KEY' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  key!: string;

  @ApiProperty({ description: 'Stored encrypted at rest.' })
  @IsString()
  @MaxLength(10_000)
  value!: string;
}
