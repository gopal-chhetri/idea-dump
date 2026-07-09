import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { AuthService } from '../auth.service';
import { OAuthProvider } from '../../entities/enums';

type DoneCallback = (err: Error | null, user?: Express.User) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'placeholder',
      callbackURL:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: DoneCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email from GitHub profile'));
      return;
    }

    const user = await this.authService.validateOAuthUser(
      OAuthProvider.GITHUB,
      profile.id,
      email,
    );
    done(null, user ?? undefined);
  }
}
