import { Module, NotFoundException } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ThrottlerModule } from '@nestjs/throttler';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CvProfileModule } from './cv-profile/cv-profile.module';
import { IdeasModule } from './ideas/ideas.module';
import { AdminModule } from './admin/admin.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { entityClasses, ormConnectionOptions } from './config/orm.config';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      entities: entityClasses,
      ...ormConnectionOptions,
      // findOneOrFail misses become 404s instead of unhandled 500s.
      findOneOrFailHandler: (entityName: string) =>
        new NotFoundException(`${entityName} not found`),
    }),
    // Only applied where ClientIpThrottlerGuard is used (the auth routes).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    AdminModule,
    RateLimitModule,
    AuthModule,
    UsersModule,
    CvProfileModule,
    IdeasModule,
  ],
})
export class AppModule {}
