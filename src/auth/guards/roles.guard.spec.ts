import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../entities/enums';

function context(user?: { id: string; role?: UserRole }): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guardRequiring = (roles?: UserRole[]) => {
    const reflector = {
      getAllAndOverride: () => roles,
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('allows any authenticated user when no roles are required', () => {
    expect(guardRequiring().canActivate(context({ id: 'u' }))).toBe(true);
  });

  it('allows a user with a required role', () => {
    const guard = guardRequiring([UserRole.ADMIN]);
    expect(guard.canActivate(context({ id: 'u', role: UserRole.ADMIN }))).toBe(
      true,
    );
  });

  it('forbids a user without a required role', () => {
    const guard = guardRequiring([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(context({ id: 'u', role: UserRole.USER })),
    ).toThrow(ForbiddenException);
  });
});
