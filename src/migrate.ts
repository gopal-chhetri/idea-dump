import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { entityClasses, ormConnectionOptions } from './config/orm.config';

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
    ...ormConnectionOptions,
    entities: entityClasses,
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
