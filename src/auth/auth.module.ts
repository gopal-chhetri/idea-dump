import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_PRIVATE_KEY
        ? Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64').toString('utf-8')
        : 'dev-secret-not-for-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
        algorithm: process.env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
