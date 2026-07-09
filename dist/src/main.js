"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_interceptor_1 = require("./common/interceptors/response.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const swagger_1 = require("@nestjs/swagger");
const node_path_1 = require("node:path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:4000',
            'http://localhost:8080',
            'null',
        ],
        credentials: true,
    });
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });
    app.useStaticAssets((0, node_path_1.join)(process.cwd(), 'frontend'), { prefix: '/app' });
    app.useStaticAssets((0, node_path_1.join)(process.cwd(), 'admin'), { prefix: '/admin' });
    httpAdapter.get('/', (_req, res) => {
        res.redirect('/app/');
    });
    httpAdapter.get('/app', (_req, res) => {
        res.redirect('/app/');
    });
    httpAdapter.get('/admin', (_req, res) => {
        res.redirect('/admin/');
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new response_interceptor_1.ResponseInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Idea Dump API')
        .setDescription('The core API documentation for the Idea Dump portfolio project.')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth', 'Registration, login, token refresh, and OAuth flows')
        .addTag('Ideas', 'CRUD, scoring, and ranking overrides for the idea backlog')
        .addTag('CV Profile', 'Professional summary and skill calibration data used for fit scoring')
        .addTag('Admin', 'Platform administration endpoints (admin-only)')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map