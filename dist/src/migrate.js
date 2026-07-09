"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@mikro-orm/core");
const postgresql_1 = require("@mikro-orm/postgresql");
async function main() {
    const orm = await core_1.MikroORM.init({
        driver: postgresql_1.PostgreSqlDriver,
        dbName: process.env.DB_NAME || 'idea_dump',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        entities: [],
        migrations: {
            path: './dist/migrations',
            pathTs: './src/migrations',
        },
    });
    const migrator = orm.migrator;
    const pending = await migrator.getPending();
    if (pending.length === 0) {
        console.log('No pending migrations.');
        await orm.close();
        return;
    }
    console.log(`Running ${pending.length} migration(s):`);
    for (const m of pending) {
        console.log(`  - ${m.name}`);
    }
    await migrator.up();
    console.log('Migrations complete.');
    await orm.close();
}
main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map