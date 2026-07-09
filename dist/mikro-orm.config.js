"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const migrations_1 = require("@mikro-orm/migrations");
exports.default = (0, postgresql_1.defineConfig)({
    entities: ['./dist/entities/**/*.entity.js'],
    entitiesTs: ['./src/entities/**/*.entity.ts'],
    dbName: process.env.DB_NAME || 'idea_prioritizer',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    extensions: [migrations_1.Migrator],
    migrations: {
        path: './dist/migrations',
        pathTs: './src/migrations',
    },
});
//# sourceMappingURL=mikro-orm.config.js.map