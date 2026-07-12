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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for the local frontend dev server
  app.enableCors({
    origin: [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:4000',
      'http://localhost:8080',
      'null', // file:// origin for direct file open
    ],
    credentials: true,
  });

  // Health-check endpoint for SPA connection detection
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Serve static assets — single unified SPA
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
