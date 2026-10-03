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
const REFRESH_TOKEN_MS = parseDuration(process.env.JWT_REFRESH_EXPIRY ?? '7d');

/**
 * Parses durations like "7d", "12h", "30m" or a bare number of days. Unknown
 * formats fall back to 7 days rather than silently misreading the unit.
 */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*([dhms]?)$/.exec(value.trim());
  const day = 24 * 60 * 60 * 1000;
  if (!match) return 7 * day;
  const amount = Number(match[1]);
  const unit = { d: day, h: 60 * 60 * 1000, m: 60 * 1000, s: 1000, '': day };
  return amount * unit[match[2] as keyof typeof unit];
}

/** Emails are compared case-insensitively and without surrounding spaces. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly em: EntityManager,
  ) {}

  // ── Local auth ──────────────────────────────────────────

  async register(rawEmail: string, password: string) {
    const email = normalizeEmail(rawEmail);
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.usersService.create({ email, passwordHash });
    return this.issueTokens(user);
  }

  async validateLocalUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(normalizeEmail(email));
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

  /** Revokes the given refresh token if it belongs to userId. */
  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const stored = await this.em.findOne(RefreshToken, {
      tokenHash: this.hashToken(rawRefreshToken),
      user: userId,
      revokedAt: null,
    });
    if (stored) {
      stored.revokedAt = new Date();
      await this.em.flush();
    }
  }

  // ── OAuth ───────────────────────────────────────────────

  /**
   * Builds the post-login redirect URL for the OAuth provider (Google).
   * Tokens go in the URL fragment, which browsers never send to servers, so
   * they stay out of proxy access logs and Referer headers. Falls back to a
   * friendly error redirect when no user session is present.
   */
  async oauthRedirectUrl(user: User | undefined): Promise<string> {
    const frontendOrigin =
      process.env.FRONTEND_URL || 'http://localhost:3000/app';
    if (!user) {
      return `${frontendOrigin}?error=auth_failed`;
    }
    const tokens = await this.issueTokens(user);
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return `${frontendOrigin}#${params.toString()}`;
  }

  async validateOAuthUser(
    provider: OAuthProvider,
    providerAccountId: string,
    rawEmail: string,
  ) {
    const email = normalizeEmail(rawEmail);
    // Check if OAuth account already linked
    const existingOAuth = await this.em.findOne(OAuthAccount, {
      provider,
      providerAccountId,
    });

    if (existingOAuth) {
      const user = await this.usersService.findById(existingOAuth.user.id);
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
      // Potential reuse detected - revoke all tokens for user
      if (stored) {
        await this.revokeAllUserTokens(stored.user.id);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token
    stored.revokedAt = new Date();

    // Load user
    const userId = stored.user.id;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.em.flush();
    return this.issueTokens(user);
  }

  // ── Helpers ─────────────────────────────────────────────

  private async issueTokens(user: User) {
    const populated =
      user.role && typeof user.role === 'object'
        ? user
        : await this.em.populate(user, ['role']);
    const roleValue = populated.role.value;
    const payload = { sub: user.id, email: user.email, role: roleValue };

    const accessToken = await this.jwtService.signAsync(payload);

    // Generate opaque refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);

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
