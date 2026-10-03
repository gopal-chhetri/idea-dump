import { Migrator } from '@mikro-orm/migrations';
import * as entityExports from '../entities';

/** Every entity class exported from src/entities (enums filtered out). */
export const entityClasses = Object.values(entityExports).filter(
  (
    x,
  ): x is Extract<
    (typeof entityExports)[keyof typeof entityExports],
    new (...args: never[]) => unknown
  > => typeof x === 'function',
);

/**
 * Connection and migration settings shared by the app, the migrate script
 * and the MikroORM CLI, so the three can't drift apart.
 */
export const ormConnectionOptions = {
  dbName: process.env.DB_NAME || 'idea_dump',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
  extensions: [Migrator],
  migrations: {
    path: './dist/src/migrations',
    pathTs: './src/migrations',
  },
};
