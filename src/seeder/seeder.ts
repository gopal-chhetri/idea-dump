import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CvProfileService } from '../cv-profile/cv-profile.service';
import { IdeasService } from '../ideas/ideas.service';
import { ScoringService } from '../scoring/scoring.service';
import { SkillCategory, UserRole } from '../entities/enums';

const DEMO_EMAIL = 'user@gmail.com';
const DEMO_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'password123';
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
    const seedUser = async (
      email: string,
      password: string,
      role: UserRole,
    ) => {
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

    const demo = await seedUser(DEMO_EMAIL, DEMO_PASSWORD, UserRole.USER);
    await seedUser(ADMIN_EMAIL, ADMIN_PASSWORD, UserRole.ADMIN);

    // Only seed CV + ideas for demo user (admin has no profile/ideas)
    const existingProfile = await cvProfileService.getProfile(demo.id);
    if (!existingProfile) {
      const profile = await cvProfileService.upsertProfile(
        demo.id,
        'Full-stack engineer with strong experience in TypeScript, NestJS, and PostgreSQL. ' +
          'Comfortable designing distributed systems, containerizing workloads with Docker, and owning features end to end.',
      );
      console.log(`Created CV profile ${profile.id}`);

      for (const skill of DEMO_SKILLS) {
        const created = await cvProfileService.addSkill(
          demo.id,
          skill.name,
          skill.category,
          skill.weight,
        );
        console.log(
          `  + skill: ${created.name} (${created.category}, w=${created.weight})`,
        );
      }

      for (const idea of DEMO_IDEAS) {
        const created = await ideasService.create(demo.id, idea);
        await scoringService.scoreIdea(created.id, demo.id);
        console.log(`Created + scored idea: ${created.title} (${created.id})`);
      }
    } else {
      console.log('Demo user CV profile already exists. Skipping CV + ideas.');
    }

    console.log('\nSeeding complete.');
    console.log(`  user:  ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${UserRole.USER})`);
    console.log(
      `  admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (${UserRole.ADMIN})`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
