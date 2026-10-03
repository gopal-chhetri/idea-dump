import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { join } from 'node:path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Close MikroORM and Redis cleanly when the container is stopped.
  app.enableShutdownHooks();

  // The SPA is served same-origin, so CORS only matters for separate local
  // dev servers. Auth uses bearer tokens, not cookies, so no credentials.
  app.enableCors({
    origin: (
      process.env.CORS_ORIGINS ??
      'http://localhost:5500,http://127.0.0.1:5500,http://localhost:4000,http://localhost:8080'
    )
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  });

  // Security headers everywhere; a CSP only for the SPA, since Swagger UI
  // needs its own inline assets. The CSP allows the CDNs the SPA loads
  // (Phosphor icons from unpkg, Google Fonts) and its inline onclick
  // handlers.
  app.use(
    '/app',
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://unpkg.com'],
          scriptSrcAttr: ["'unsafe-inline'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://unpkg.com',
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://unpkg.com', 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
        },
      },
    }),
  );
  app.use(helmet({ contentSecurityPolicy: false }));

  // Health-check endpoint for SPA connection detection
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      dailyLimit: Number(process.env.IDEA_DAILY_LIMIT) || 10,
    });
  });

  // Serve static assets - single unified SPA
  app.useStaticAssets(join(process.cwd(), 'app'), { prefix: '/app' });
  httpAdapter.get('/', (_req: Request, res: Response) => {
    res.redirect('/app/');
  });
  httpAdapter.get('/app', (_req: Request, res: Response) => {
    res.redirect('/app/');
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Idea Dump API')
    .setDescription(
      'The core API documentation for the Idea Dump portfolio project.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Registration, login, token refresh, and OAuth flows')
    .addTag(
      'Ideas',
      'CRUD, scoring, and ranking overrides for the idea backlog',
    )
    .addTag(
      'CV Profile',
      'Professional summary and skill calibration data used for fit scoring',
    )
    .addTag('Admin', 'Platform administration endpoints (admin-only)')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
