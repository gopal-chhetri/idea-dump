import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';

type JwtExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthCompatController } from './auth-compat.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { jwtKeys } from '../config/secrets';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const keys = jwtKeys();
        return {
          secret: keys.signingKey,
          signOptions: {
            expiresIn: (process.env.JWT_ACCESS_EXPIRY ||
              '15m') as unknown as JwtExpiresIn,
            algorithm: keys.algorithm,
          },
        };
      },
    }),
  ],
  controllers: [AuthController, AuthCompatController],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
