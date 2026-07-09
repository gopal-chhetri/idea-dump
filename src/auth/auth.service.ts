import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OAuthAccount, OAuthProvider } from '../entities';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly em: EntityManager,
  ) {}

  // ── Local auth ──────────────────────────────────────────

  async register(email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.usersService.create({ email, passwordHash });
    return this.issueTokens(user);
  }

  async validateLocalUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User) {
    return this.issueTokens(user);
  }

  // ── OAuth ───────────────────────────────────────────────

  async validateOAuthUser(
    provider: OAuthProvider,
    providerAccountId: string,
    email: string,
  ) {
    // Check if OAuth account already linked
    const existingOAuth = await this.em.findOne(OAuthAccount, {
      provider,
      providerAccountId,
    });

    if (existingOAuth) {
      const user = await this.usersService.findById(
        typeof existingOAuth.user === 'string'
          ? existingOAuth.user
          : existingOAuth.user.id,
      );
      return user;
    }

    // Link by email or create new user
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({ email });
    }

    const oauthAccount = this.em.create(OAuthAccount, {
      user,
      provider,
      providerAccountId,
    });
    this.em.persist(oauthAccount);
    await this.em.flush();

    return user;
  }

  // ── Refresh rotation ────────────────────────────────────

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.em.findOne(RefreshToken, { tokenHash });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Potential reuse detected — revoke all tokens for user
      if (stored) {
        await this.revokeAllUserTokens(
          typeof stored.user === 'string' ? stored.user : stored.user.id,
        );
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token
    stored.revokedAt = new Date();

    // Load user
    const userId =
      typeof stored.user === 'string' ? stored.user : stored.user.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.em.flush();
    return this.issueTokens(user);
  }

  // ── Helpers ─────────────────────────────────────────────

  private async issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload);

    // Generate opaque refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    const refreshTokenEntity = this.em.create(RefreshToken, {
      user,
      tokenHash,
      expiresAt,
    });
    this.em.persist(refreshTokenEntity);
    await this.em.flush();

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async revokeAllUserTokens(userId: string) {
    const tokens = await this.em.find(RefreshToken, {
      user: userId,
      revokedAt: null,
    });
    tokens.forEach((t) => (t.revokedAt = new Date()));
    await this.em.flush();
  }
}
