import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import * as entities from './entities';

async function main() {
  console.log('=== Migration Script Starting ===');
  console.log('Environment:', {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PORT: process.env.DB_PORT,
    DB_PASS: process.env.DB_PASS ? '***' : 'NOT SET',
  });

  const orm = await MikroORM.init<PostgreSqlDriver>({
    driver: PostgreSqlDriver,
    dbName: process.env.DB_NAME || 'idea_dump',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    entities: Object.values(entities).filter((x) => typeof x === 'function') as any,
    extensions: [Migrator],
    migrations: {
      path: './dist/src/migrations',
      pathTs: './src/migrations',
    },
  });

  console.log('Database connection established.');

  const migrator = orm.migrator;
  const pending = await migrator.getPending();
  const executed = await migrator.getExecuted();

  console.log(`Executed migrations: ${executed.length}`);
  for (const m of executed) {
    console.log(`  ✓ ${m.name}`);
  }

  if (pending.length === 0) {
    console.log('No pending migrations.');
    await orm.close();
    return;
  }

  console.log(`Running ${pending.length} pending migration(s):`);
  for (const m of pending) {
    console.log(`  → ${m.name}`);
  }

  await migrator.up();
  console.log('✓ All migrations complete.');
  await orm.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
