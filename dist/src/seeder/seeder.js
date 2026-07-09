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
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const cv_profile_service_1 = require("../cv-profile/cv-profile.service");
const ideas_service_1 = require("../ideas/ideas.service");
const scoring_service_1 = require("../scoring/scoring.service");
const enums_1 = require("../entities/enums");
const DEMO_EMAIL = 'user@gmail.com';
const DEMO_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'password123';
const SALT_ROUNDS = 12;
const DEMO_SKILLS = [
    { name: 'TypeScript', category: enums_1.SkillCategory.LANGUAGE, weight: 5 },
    { name: 'NestJS', category: enums_1.SkillCategory.FRAMEWORK, weight: 5 },
    { name: 'PostgreSQL', category: enums_1.SkillCategory.TOOL, weight: 4 },
    { name: 'Docker', category: enums_1.SkillCategory.TOOL, weight: 4 },
    { name: 'System Design', category: enums_1.SkillCategory.DOMAIN, weight: 4 },
];
const DEMO_IDEAS = [
    {
        title: 'AI-powered Code Review Bot',
        description: 'A GitHub App that uses LLMs to perform contextual code review, flag bugs, and suggest improvements on every pull request.',
        useCase: 'Software teams wanting automated, AI-assisted code review without switching tools.',
        features: [
            'PR diff analysis',
            'LLM integration',
            'GitHub Actions',
            'Rate limiting',
        ],
    },
    {
        title: 'Real-time Collaborative Markdown Editor',
        description: 'A browser-based editor with CRDT-powered multi-user editing, offline support, and version history.',
        useCase: 'Distributed teams and technical writers collaborating on documentation in real time.',
        features: [
            'Yjs CRDTs',
            'WebSocket syncing',
            'Version history',
            'Theme toggle',
        ],
    },
    {
        title: 'Self-hosted Analytics Pipeline',
        description: 'A privacy-first event ingestion and dashboard stack built on Postgres and a lightweight worker, deployable via Docker.',
        useCase: 'Indie makers and startups needing GDPR-friendly product analytics without third-party SaaS.',
        features: [
            'Event ingestion',
            'SQL dashboards',
            'Docker Compose',
            'Export API',
        ],
    },
];
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const cvProfileService = app.get(cv_profile_service_1.CvProfileService);
    const ideasService = app.get(ideas_service_1.IdeasService);
    const scoringService = app.get(scoring_service_1.ScoringService);
    try {
        const seedUser = async (email, password, role) => {
            const existing = await usersService.findByEmail(email);
            if (existing) {
                console.log(`${role} already exists (${email}). Skipping.`);
                return existing;
            }
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            const user = await usersService.create({ email, passwordHash, role });
            console.log(`Created ${role} ${user.email} (${user.id})`);
            return user;
        };
        const demo = await seedUser(DEMO_EMAIL, DEMO_PASSWORD, enums_1.UserRole.USER);
        await seedUser(ADMIN_EMAIL, ADMIN_PASSWORD, enums_1.UserRole.ADMIN);
        const existingProfile = await cvProfileService.getProfile(demo.id);
        if (!existingProfile) {
            const profile = await cvProfileService.upsertProfile(demo.id, 'Full-stack engineer with strong experience in TypeScript, NestJS, and PostgreSQL. ' +
                'Comfortable designing distributed systems, containerizing workloads with Docker, and owning features end to end.');
            console.log(`Created CV profile ${profile.id}`);
            for (const skill of DEMO_SKILLS) {
                const created = await cvProfileService.addSkill(demo.id, skill.name, skill.category, skill.weight);
                console.log(`  + skill: ${created.name} (${created.category}, w=${created.weight})`);
            }
            for (const idea of DEMO_IDEAS) {
                const created = await ideasService.create(demo.id, idea);
                await scoringService.scoreIdea(created.id, demo.id);
                console.log(`Created + scored idea: ${created.title} (${created.id})`);
            }
        }
        else {
            console.log('Demo user CV profile already exists. Skipping CV + ideas.');
        }
        console.log('\nSeeding complete.');
        console.log(`  user:  ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${enums_1.UserRole.USER})`);
        console.log(`  admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (${enums_1.UserRole.ADMIN})`);
    }
    finally {
        await app.close();
    }
}
bootstrap().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seeder.js.map