"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const ioredis_1 = __importDefault(require("ioredis"));
const daily_idea_quota_entity_1 = require("../entities/daily-idea-quota.entity");
let RateLimitGuard = class RateLimitGuard {
    redis;
    em;
    dailyLimit;
    constructor(redis, em) {
        this.redis = redis;
        this.em = em;
        this.dailyLimit = Number(process.env.IDEA_DAILY_LIMIT) || 2;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId)
            return false;
        const today = this.utcDateString();
        const redisKey = `idea_quota:${userId}:${today}`;
        try {
            const current = await this.redis.incr(redisKey);
            if (current === 1) {
                const secondsUntilMidnight = this.secondsUntilUtcMidnight();
                await this.redis.expire(redisKey, secondsUntilMidnight);
            }
            if (current > this.dailyLimit) {
                throw new common_1.HttpException(`Daily idea limit (${this.dailyLimit}) reached. Try again tomorrow.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            console.warn('Redis unavailable, falling back to DB quota check:', err);
            await this.checkDbQuota(userId, today);
        }
        return true;
    }
    async checkDbQuota(userId, today) {
        const quota = await this.em.findOne(daily_idea_quota_entity_1.DailyIdeaQuota, {
            user: userId,
            date: today,
        });
        if (quota && quota.count >= this.dailyLimit) {
            throw new common_1.HttpException(`Daily idea limit (${this.dailyLimit}) reached. Try again tomorrow.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
    }
    utcDateString() {
        return new Date().toISOString().slice(0, 10);
    }
    secondsUntilUtcMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setUTCDate(midnight.getUTCDate() + 1);
        midnight.setUTCHours(0, 0, 0, 0);
        return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [ioredis_1.default,
        postgresql_1.EntityManager])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map