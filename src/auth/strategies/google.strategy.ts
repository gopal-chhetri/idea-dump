import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { OAuthProvider } from '../../entities/enums';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/app';
    const origin = frontendUrl.replace(/\/app\/?$/, '');
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
      // Explicit redirect_uri matching the single URI registered on the
      // Google OAuth App, derived from FRONTEND_URL so they can't drift.
      // /api/auth/google/callback is also served but is not registered.
      callbackURL: `${origin}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email from Google profile'), undefined);
      return;
    }

    const user = await this.authService.validateOAuthUser(
      OAuthProvider.GOOGLE,
      profile.id,
      email,
    );
    done(null, user ?? undefined);
  }
}
