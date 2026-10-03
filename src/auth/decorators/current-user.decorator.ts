import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** The authenticated user's ID, as set by JwtStrategy.validate(). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    (ctx.switchToHttp().getRequest<Request>().user as { id: string }).id,
);
