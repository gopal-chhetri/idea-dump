"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        if (context.getType() !== 'http')
            return next.handle();
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { method, url } = request;
        const startedAt = Date.now();
        return next.handle().pipe((0, operators_1.tap)(() => {
            const statusCode = response.statusCode;
            this.logger.log(`${method} ${url} -> ${statusCode} (${Date.now() - startedAt}ms)`);
        }), (0, operators_1.catchError)((err) => {
            const statusCode = err instanceof common_1.HttpException ? err.getStatus() : 500;
            const elapsed = Date.now() - startedAt;
            const msg = `${method} ${url} -> ${statusCode} (${elapsed}ms)`;
            if (statusCode >= 500)
                this.logger.error(msg);
            else
                this.logger.warn(msg);
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map