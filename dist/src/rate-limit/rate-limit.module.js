"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitModule = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const rate_limit_guard_1 = require("./rate-limit.guard");
let RateLimitModule = class RateLimitModule {
};
exports.RateLimitModule = RateLimitModule;
exports.RateLimitModule = RateLimitModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: () => {
                    return new ioredis_1.default({
                        host: process.env.REDIS_HOST || 'localhost',
                        port: Number(process.env.REDIS_PORT) || 6379,
                        maxRetriesPerRequest: 3,
                        retryStrategy: (times) => Math.min(times * 100, 3000),
                    });
                },
            },
            rate_limit_guard_1.RateLimitGuard,
        ],
        exports: ['REDIS_CLIENT', rate_limit_guard_1.RateLimitGuard],
    })
], RateLimitModule);
//# sourceMappingURL=rate-limit.module.js.map