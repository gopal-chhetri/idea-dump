import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CvProfileService } from '../cv-profile/cv-profile.service';
import { IdeasService } from '../ideas/ideas.service';
import { ScoringService } from '../scoring/scoring.service';
import { SkillCategory } from '../entities/enums';

const DEMO_EMAIL = 'user@gmail.com';
const DEMO_PASSWORD = 'password123';
const SALT_ROUNDS = 12;

const DEMO_SKILLS: { name: string; category: SkillCategory; weight: number }[] =
  [
    { name: 'TypeScript', category: SkillCategory.LANGUAGE, weight: 5 },
    { name: 'NestJS', category: SkillCategory.FRAMEWORK, weight: 5 },
    { name: 'PostgreSQL', category: SkillCategory.TOOL, weight: 4 },
    { name: 'Docker', category: SkillCategory.TOOL, weight: 4 },
    { name: 'System Design', category: SkillCategory.DOMAIN, weight: 4 },
  ];

const DEMO_IDEAS: {
  title: string;
  description: string;
  useCase: string;
  features: string[];
}[] = [
  {
    title: 'AI-powered Code Review Bot',
    description:
      'A GitHub App that uses LLMs to perform contextual code review, flag bugs, and suggest improvements on every pull request.',
    useCase:
      'Software teams wanting automated, AI-assisted code review without switching tools.',
    features: [
      'PR diff analysis',
      'LLM integration',
      'GitHub Actions',
      'Rate limiting',
    ],
  },
  {
    title: 'Real-time Collaborative Markdown Editor',
    description:
      'A browser-based editor with CRDT-powered multi-user editing, offline support, and version history.',
    useCase:
      'Distributed teams and technical writers collaborating on documentation in real time.',
    features: [
      'Yjs CRDTs',
      'WebSocket syncing',
      'Version history',
      'Theme toggle',
    ],
  },
  {
    title: 'Self-hosted Analytics Pipeline',
    description:
      'A privacy-first event ingestion and dashboard stack built on Postgres and a lightweight worker, deployable via Docker.',
    useCase:
      'Indie makers and startups needing GDPR-friendly product analytics without third-party SaaS.',
    features: [
      'Event ingestion',
      'SQL dashboards',
      'Docker Compose',
      'Export API',
    ],
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const cvProfileService = app.get(CvProfileService);
  const ideasService = app.get(IdeasService);
  const scoringService = app.get(ScoringService);

  try {
    const existing = await usersService.findByEmail(DEMO_EMAIL);
    if (existing) {
      console.log(`Demo user already exists (${DEMO_EMAIL}). Skipping seed.`);
      return;
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const user = await usersService.create({ email: DEMO_EMAIL, passwordHash });
    console.log(`Created demo user ${user.email} (${user.id})`);

    const profile = await cvProfileService.upsertProfile(
      user.id,
      'Full-stack engineer with strong experience in TypeScript, NestJS, and PostgreSQL. ' +
        'Comfortable designing distributed systems, containerizing workloads with Docker, and owning features end to end.',
    );
    console.log(`Created CV profile ${profile.id}`);

    for (const skill of DEMO_SKILLS) {
      const created = await cvProfileService.addSkill(
        user.id,
        skill.name,
        skill.category,
        skill.weight,
      );
      console.log(
        `  + skill: ${created.name} (${created.category}, w=${created.weight})`,
      );
    }

    for (const idea of DEMO_IDEAS) {
      const created = await ideasService.create(user.id, idea);
      await scoringService.scoreIdea(created.id, user.id);
      console.log(`Created + scored idea: ${created.title} (${created.id})`);
    }

    console.log('\nSeeding complete.');
    console.log(`  email:    ${DEMO_EMAIL}`);
    console.log(`  password: ${DEMO_PASSWORD}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
