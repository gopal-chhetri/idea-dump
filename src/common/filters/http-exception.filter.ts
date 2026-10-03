import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? HttpExceptionFilter.messageOf(exception)
        : 'Internal server error';

    const detail =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${message}`,
        detail,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * ValidationPipe (and other built-in exceptions) put the useful detail in
   * the response body's `message`, which may be an array of field errors;
   * `exception.message` is only the generic "Bad Request Exception".
   */
  static messageOf(exception: HttpException): string {
    const body = exception.getResponse();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const detail: unknown = body.message;
      if (Array.isArray(detail)) return detail.map(String).join('; ');
      if (typeof detail === 'string') return detail;
    }
    return exception.message;
  }
}
