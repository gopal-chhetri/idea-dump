"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@mikro-orm/core");
const postgresql_1 = require("@mikro-orm/postgresql");
const migrations_1 = require("@mikro-orm/migrations");
const entities = __importStar(require("./entities"));
async function main() {
    console.log('=== Migration Script Starting ===');
    console.log('Environment:', {
        DB_HOST: process.env.DB_HOST,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PORT: process.env.DB_PORT,
        DB_PASS: process.env.DB_PASS ? '***' : 'NOT SET',
    });
    const orm = await core_1.MikroORM.init({
        driver: postgresql_1.PostgreSqlDriver,
        dbName: process.env.DB_NAME || 'idea_dump',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'password',
        entities: Object.values(entities).filter((x) => typeof x === 'function'),
        extensions: [migrations_1.Migrator],
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
//# sourceMappingURL=migrate.js.map