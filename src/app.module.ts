import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CvProfileModule } from './cv-profile/cv-profile.module';
import { IdeasModule } from './ideas/ideas.module';
import { AdminModule } from './admin/admin.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import * as entities from './entities';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: PostgreSqlDriver,
      allowGlobalContext: true,
      entities: Object.values(entities),
      dbName: process.env.DB_NAME || 'idea_dump',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'password',
      extensions: [Migrator],
      migrations: {
        path: './dist/migrations',
        pathTs: './src/migrations',
      },
    }),
    AdminModule,
    RateLimitModule,
    AuthModule,
    UsersModule,
    CvProfileModule,
    IdeasModule,
  ],
})
export class AppModule {}
