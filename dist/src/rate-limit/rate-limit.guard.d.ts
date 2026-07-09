import { CanActivate, ExecutionContext } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import Redis from 'ioredis';
export declare class RateLimitGuard implements CanActivate {
    private readonly redis;
    private readonly em;
    private readonly dailyLimit;
    constructor(redis: Redis, em: EntityManager);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private checkDbQuota;
    private utcDateString;
    private secondsUntilUtcMidnight;
}
