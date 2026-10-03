import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Opaque refresh token issued at login/register' })
  @IsString()
  @MaxLength(256)
  refreshToken!: string;
}
