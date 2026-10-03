import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/postgresql';
import * as crypto from 'crypto';
import { AuthService, normalizeEmail, parseDuration } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../entities/user.entity';

const sha256 = (v: string) =>
  crypto.createHash('sha256').update(v).digest('hex');

/** Minimal in-memory stand-in for the EntityManager calls AuthService makes. */
function fakeEm(tokens: RefreshToken[]) {
  return {
    findOne: jest.fn(
      (_entity: unknown, where: Record<string, unknown>) =>
        tokens.find(
          (t) =>
            t.tokenHash === where.tokenHash &&
            (where.user === undefined || t.user.id === where.user) &&
            (where.revokedAt !== null || !t.revokedAt),
        ) ?? null,
    ),
    find: jest.fn((_entity: unknown, where: { user: string }) =>
      tokens.filter((t) => t.user.id === where.user && !t.revokedAt),
    ),
    create: jest.fn((_entity: unknown, data: Partial<RefreshToken>) => {
      const token = { ...data } as RefreshToken;
      tokens.push(token);
      return token;
    }),
    persist: jest.fn(),
    flush: jest.fn(),
    populate: jest.fn((u: User) => u),
  } as unknown as EntityManager;
}

describe('AuthService', () => {
  const user = { id: 'u1', email: 'a@b.c', role: { value: 'user' } } as User;
  let tokens: RefreshToken[];
  let service: AuthService;

  beforeEach(() => {
    tokens = [];
    const users = {
      findById: jest.fn(() => user),
    } as unknown as UsersService;
    const jwt = {
      signAsync: jest.fn(() => 'access'),
    } as unknown as JwtService;
    service = new AuthService(users, jwt, fakeEm(tokens));
  });

  it('rotates refresh tokens and rejects the old one', async () => {
    const first = await service.login(user);
    const second = await service.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    await expect(service.refresh(first.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('revokes every session when a used token is replayed', async () => {
    const first = await service.login(user);
    const second = await service.refresh(first.refreshToken);
    await expect(service.refresh(first.refreshToken)).rejects.toThrow();

    // Reuse detection revoked the newer token too.
    await expect(service.refresh(second.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('logout revokes the refresh token', async () => {
    const pair = await service.login(user);
    await service.logout(user.id, pair.refreshToken);
    const stored = tokens.find(
      (t) => t.tokenHash === sha256(pair.refreshToken),
    );
    expect(stored?.revokedAt).toBeInstanceOf(Date);
    await expect(service.refresh(pair.refreshToken)).rejects.toThrow();
  });

  it('logout ignores tokens belonging to another user', async () => {
    const pair = await service.login(user);
    await service.logout('someone-else', pair.refreshToken);
    const stored = tokens.find(
      (t) => t.tokenHash === sha256(pair.refreshToken),
    );
    expect(stored?.revokedAt).toBeUndefined();
  });
});

describe('parseDuration', () => {
  const day = 24 * 60 * 60 * 1000;
  it.each([
    ['7d', 7 * day],
    ['12h', 12 * 60 * 60 * 1000],
    ['30m', 30 * 60 * 1000],
    ['3', 3 * day],
    ['garbage', 7 * day],
  ])('%s', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
});

describe('normalizeEmail', () => {
  it('trims and lower-cases', () => {
    expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
  });
});
