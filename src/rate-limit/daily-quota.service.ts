import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import Redis from 'ioredis';
import { v4 } from 'uuid';
import { DailyIdeaQuota } from '../entities/daily-idea-quota.entity';

/**
 * Daily idea-creation quota. Redis holds the fast, atomic counter; the
 * daily_idea_quotas table is a backstop used when Redis is unavailable.
 */
@Injectable()
export class DailyQuotaService {
  private readonly logger = new Logger(DailyQuotaService.name);
  readonly dailyLimit = Number(process.env.IDEA_DAILY_LIMIT) || 10;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly em: EntityManager,
  ) {}

  /**
   * Atomically reserves one idea for today, throwing 429 when the limit is
   * reached. Returns a release function to undo the reservation if the idea
   * is not created after all.
   */
  async reserve(userId: string): Promise<() => Promise<void>> {
    const today = utcDateString();
    const key = `idea_quota:${userId}:${today}`;
    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, secondsUntilUtcMidnight());
      }
      if (current > this.dailyLimit) {
        await this.redis.decr(key);
        throw this.limitReached();
      }
      return async () => {
        await this.redis.decr(key).catch(() => undefined);
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.warn(
        `Redis unavailable, falling back to DB quota check: ${String(err)}`,
      );
      await this.checkDb(userId, today);
      return () => Promise.resolve();
    }
  }

  /** Records a created idea in the DB backstop (atomic upsert). */
  async recordInDb(userId: string): Promise<void> {
    await this.em
      .getConnection()
      .execute(
        `insert into "daily_idea_quotas" ("id", "user_id", "date", "count") values (?, ?, ?, 1) on conflict ("user_id", "date") do update set "count" = "daily_idea_quotas"."count" + 1`,
        [v4(), userId, utcDateString()],
      );
  }

  private async checkDb(userId: string, today: string): Promise<void> {
    const quota = await this.em.findOne(DailyIdeaQuota, {
      user: userId,
      date: today,
    });
    if (quota && quota.count >= this.dailyLimit) {
      throw this.limitReached();
    }
  }

  private limitReached(): HttpException {
    return new HttpException(
      `Daily idea limit (${this.dailyLimit}) reached. Try again tomorrow.`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}
