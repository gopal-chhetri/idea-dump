import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        this.logger.log(
          `${method} ${url} -> ${statusCode} (${Date.now() - startedAt}ms)`,
        );
      }),
      catchError((err) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;
        const elapsed = Date.now() - startedAt;
        const msg = `${method} ${url} -> ${statusCode} (${elapsed}ms)`;
        if (statusCode >= 500) this.logger.error(msg);
        else this.logger.warn(msg);
        return throwError(() => err as unknown);
      }),
    );
  }
}
