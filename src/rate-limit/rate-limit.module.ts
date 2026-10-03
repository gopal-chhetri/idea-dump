import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { DailyQuotaService } from './daily-quota.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
        });
      },
    },
    DailyQuotaService,
  ],
  exports: ['REDIS_CLIENT', DailyQuotaService],
})
export class RateLimitModule {}
