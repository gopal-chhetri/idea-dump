import { defineConfig } from '@mikro-orm/postgresql';
import { ormConnectionOptions } from './src/config/orm.config';

export default defineConfig({
  ...ormConnectionOptions,
  entities: ['./dist/src/entities/**/*.entity.js'],
  entitiesTs: ['./src/entities/**/*.entity.ts'],
});
