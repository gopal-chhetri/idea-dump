import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password (min 8 chars)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  // bcrypt ignores input past 72 bytes
  @MaxLength(72)
  password!: string;
}
