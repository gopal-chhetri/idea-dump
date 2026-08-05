import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Request } from 'express';
import Redis from 'ioredis';
import { DailyIdeaQuota } from '../entities/daily-idea-quota.entity';

interface AuthedRequest extends Request {
  user?: { id: string };
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly dailyLimit: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly em: EntityManager,
  ) {
    this.dailyLimit = Number(process.env.DAILY_LIMIT) || 2;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const userId = request.user?.id;
    if (!userId) return false;

    const today = this.utcDateString();
    const redisKey = `idea_quota:${userId}:${today}`;

    try {
      // Redis fast-path
      const current = await this.redis.incr(redisKey);

      if (current === 1) {
        // First idea today - set expiry to seconds until UTC midnight
        const secondsUntilMidnight = this.secondsUntilUtcMidnight();
        await this.redis.expire(redisKey, secondsUntilMidnight);
      }

      if (current > this.dailyLimit) {
        throw new HttpException(
          `Daily idea limit (${this.dailyLimit}) reached. Try again tomorrow.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;

      // Redis unavailable - fall back to DB
      console.warn(
        'Redis unavailable, falling back to DB quota check:',
        err as unknown,
      );
      await this.checkDbQuota(userId, today);
    }

    return true;
  }

  /** DB backstop when Redis is down */
  private async checkDbQuota(userId: string, today: string): Promise<void> {
    const quota = await this.em.findOne(DailyIdeaQuota, {
      user: userId,
      date: today,
    });

    if (quota && quota.count >= this.dailyLimit) {
      throw new HttpException(
        `Daily idea limit (${this.dailyLimit}) reached. Try again tomorrow.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private utcDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private secondsUntilUtcMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCDate(midnight.getUTCDate() + 1);
    midnight.setUTCHours(0, 0, 0, 0);
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
  }
}
