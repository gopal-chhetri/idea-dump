import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'securePassword123', description: 'Password (min 8 chars)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
