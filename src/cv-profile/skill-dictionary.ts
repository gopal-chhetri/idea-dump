export interface SkillEntry {
  name: string;
  category: 'language' | 'framework' | 'tool' | 'domain';
}

const LANGUAGES: SkillEntry[] = [
  { name: 'TypeScript', category: 'language' },
  { name: 'JavaScript', category: 'language' },
  { name: 'Python', category: 'language' },
  { name: 'Go', category: 'language' },
  { name: 'Rust', category: 'language' },
  { name: 'Java', category: 'language' },
  { name: 'Kotlin', category: 'language' },
  { name: 'C#', category: 'language' },
  { name: 'C++', category: 'language' },
  { name: 'C', category: 'language' },
  { name: 'Ruby', category: 'language' },
  { name: 'PHP', category: 'language' },
  { name: 'Swift', category: 'language' },
  { name: 'Scala', category: 'language' },
  { name: 'Elixir', category: 'language' },
  { name: 'Clojure', category: 'language' },
  { name: 'Haskell', category: 'language' },
  { name: 'Dart', category: 'language' },
  { name: 'Lua', category: 'language' },
  { name: 'Zig', category: 'language' },
  { name: 'Perl', category: 'language' },
  { name: 'R', category: 'language' },
  { name: 'Shell', category: 'language' },
  { name: 'Bash', category: 'language' },
  { name: 'SQL', category: 'language' },
  { name: 'GraphQL', category: 'language' },
  { name: 'HTML', category: 'language' },
  { name: 'CSS', category: 'language' },
  { name: 'Sass', category: 'language' },
  { name: 'Less', category: 'language' },
];

const FRAMEWORKS: SkillEntry[] = [
  { name: 'NestJS', category: 'framework' },
  { name: 'Next.js', category: 'framework' },
  { name: 'React', category: 'framework' },
  { name: 'Vue.js', category: 'framework' },
  { name: 'Angular', category: 'framework' },
  { name: 'Svelte', category: 'framework' },
  { name: 'Solid.js', category: 'framework' },
  { name: 'Express', category: 'framework' },
  { name: 'Fastify', category: 'framework' },
  { name: 'Django', category: 'framework' },
  { name: 'Flask', category: 'framework' },
  { name: 'FastAPI', category: 'framework' },
  { name: 'Spring Boot', category: 'framework' },
  { name: 'Ruby on Rails', category: 'framework' },
  { name: 'Laravel', category: 'framework' },
  { name: 'Symfony', category: 'framework' },
  { name: 'ASP.NET', category: 'framework' },
  { name: 'Phoenix', category: 'framework' },
  { name: 'Remix', category: 'framework' },
  { name: 'Nuxt.js', category: 'framework' },
  { name: 'Gatsby', category: 'framework' },
  { name: 'Hono', category: 'framework' },
  { name: 'Elysia', category: 'framework' },
  { name: 'tRPC', category: 'framework' },
  { name: 'Prisma', category: 'framework' },
  { name: 'TypeORM', category: 'framework' },
  { name: 'MikroORM', category: 'framework' },
  { name: 'Drizzle ORM', category: 'framework' },
  { name: 'Sequelize', category: 'framework' },
  { name: 'Mongoose', category: 'framework' },
  { name: 'Tailwind CSS', category: 'framework' },
  { name: 'Bootstrap', category: 'framework' },
  { name: 'Shadcn UI', category: 'framework' },
  { name: 'Material UI', category: 'framework' },
  { name: 'Chakra UI', category: 'framework' },
  { name: 'Radix UI', category: 'framework' },
  { name: 'React Query', category: 'framework' },
  { name: 'Zustand', category: 'framework' },
  { name: 'Redux', category: 'framework' },
  { name: 'RxJS', category: 'framework' },
  { name: 'Jest', category: 'framework' },
  { name: 'Vitest', category: 'framework' },
  { name: 'Playwright', category: 'framework' },
  { name: 'Cypress', category: 'framework' },
  { name: 'PyTorch', category: 'framework' },
  { name: 'TensorFlow', category: 'framework' },
  { name: 'LangChain', category: 'framework' },
  { name: 'OpenAI SDK', category: 'framework' },
  { name: 'Hugging Face', category: 'framework' },
];

const TOOLS: SkillEntry[] = [
  { name: 'Docker', category: 'tool' },
  { name: 'Kubernetes', category: 'tool' },
  { name: 'Terraform', category: 'tool' },
  { name: 'Ansible', category: 'tool' },
  { name: 'Pulumi', category: 'tool' },
  { name: 'Helm', category: 'tool' },
  { name: 'PostgreSQL', category: 'tool' },
  { name: 'MySQL', category: 'tool' },
  { name: 'SQLite', category: 'tool' },
  { name: 'MongoDB', category: 'tool' },
  { name: 'Redis', category: 'tool' },
  { name: 'Elasticsearch', category: 'tool' },
  { name: 'S3', category: 'tool' },
  { name: 'Nginx', category: 'tool' },
  { name: 'Traefik', category: 'tool' },
  { name: 'Caddy', category: 'tool' },
  { name: 'Git', category: 'tool' },
  { name: 'GitHub Actions', category: 'tool' },
  { name: 'CI/CD', category: 'tool' },
  { name: 'Jenkins', category: 'tool' },
  { name: 'GitLab CI', category: 'tool' },
  { name: 'Prometheus', category: 'tool' },
  { name: 'Grafana', category: 'tool' },
  { name: 'Datadog', category: 'tool' },
  { name: 'Sentry', category: 'tool' },
  { name: 'OpenTelemetry', category: 'tool' },
  { name: 'RabbitMQ', category: 'tool' },
  { name: 'Kafka', category: 'tool' },
  { name: 'NATS', category: 'tool' },
  { name: 'WebSockets', category: 'tool' },
  { name: 'gRPC', category: 'tool' },
  { name: 'REST', category: 'tool' },
  { name: 'GraphQL', category: 'tool' },
  { name: 'WebRTC', category: 'tool' },
  { name: 'FFmpeg', category: 'tool' },
  { name: 'Tesseract', category: 'tool' },
  { name: 'OAuth', category: 'tool' },
  { name: 'JWT', category: 'tool' },
  { name: 'OpenID Connect', category: 'tool' },
  { name: 'Linux', category: 'tool' },
  { name: 'NGINX', category: 'tool' },
  { name: 'Apache', category: 'tool' },
  { name: 'Vite', category: 'tool' },
  { name: 'Webpack', category: 'tool' },
  { name: 'ESBuild', category: 'tool' },
  { name: 'Cloudflare', category: 'tool' },
  { name: 'AWS', category: 'tool' },
  { name: 'GCP', category: 'tool' },
  { name: 'Azure', category: 'tool' },
  { name: 'Fly.io', category: 'tool' },
  { name: 'Railway', category: 'tool' },
  { name: 'Render', category: 'tool' },
  { name: 'Vercel', category: 'tool' },
  { name: 'Netlify', category: 'tool' },
  { name: 'Infisical', category: 'tool' },
  { name: 'Cloudflare DNS', category: 'tool' },
  { name: 'Cloudflare TLS', category: 'tool' },
  { name: 'GitHub Container Registry', category: 'tool' },
  { name: 'Passport.js', category: 'tool' },
  { name: 'Swagger', category: 'tool' },
  { name: 'OpenAPI', category: 'tool' },
];

const DOMAINS: SkillEntry[] = [
  { name: 'Distributed Systems', category: 'domain' },
  { name: 'DevOps', category: 'domain' },
  { name: 'Platform Engineering', category: 'domain' },
  { name: 'Cloud Infrastructure', category: 'domain' },
  { name: 'Backend Engineering', category: 'domain' },
  { name: 'Full-Stack Development', category: 'domain' },
  { name: 'Frontend Engineering', category: 'domain' },
  { name: 'System Design', category: 'domain' },
  { name: 'Microservices', category: 'domain' },
  { name: 'API Design', category: 'domain' },
  { name: 'Database Architecture', category: 'domain' },
  { name: 'Machine Learning', category: 'domain' },
  { name: 'AI Engineering', category: 'domain' },
  { name: 'Natural Language Processing', category: 'domain' },
  { name: 'Computer Vision', category: 'domain' },
  { name: 'OCR', category: 'domain' },
  { name: 'Streaming', category: 'domain' },
  { name: 'Real-Time Systems', category: 'domain' },
  { name: 'Video Processing', category: 'domain' },
  { name: 'Audio Processing', category: 'domain' },
  { name: 'Security Engineering', category: 'domain' },
  { name: 'Authentication', category: 'domain' },
  { name: 'Authorization', category: 'domain' },
  { name: 'Site Reliability Engineering', category: 'domain' },
  { name: 'Observability', category: 'domain' },
  { name: 'Monitoring', category: 'domain' },
  { name: 'Performance Optimization', category: 'domain' },
  { name: 'Data Engineering', category: 'domain' },
  { name: 'ETL Pipelines', category: 'domain' },
  { name: 'WebAssembly', category: 'domain' },
  { name: 'Embedded Systems', category: 'domain' },
  { name: 'IoT', category: 'domain' },
  { name: 'Mobile Development', category: 'domain' },
  { name: 'Game Development', category: 'domain' },
  { name: 'Open Source', category: 'domain' },
  { name: 'Technical Leadership', category: 'domain' },
  { name: 'Code Review', category: 'domain' },
  { name: 'Agile', category: 'domain' },
  { name: 'Scrum', category: 'domain' },
];

export const SKILL_DICTIONARY: SkillEntry[] = [
  ...LANGUAGES,
  ...FRAMEWORKS,
  ...TOOLS,
  ...DOMAINS,
];

export function matchSkills(text: string): SkillEntry[] {
  const lower = text.toLowerCase();
  const matched: SkillEntry[] = [];
  const seen = new Set<string>();

  for (const entry of SKILL_DICTIONARY) {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) continue;
    const pattern = new RegExp(
      `\\b${key.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    );
    if (pattern.test(lower)) {
      matched.push(entry);
      seen.add(key);
    }
  }

  return matched;
}

export function extractSummary(text: string): string {
  const headingRegex =
    /(?:\b(?:summary|professional\s+summary|profile|about\s+me|overview)\b)[:\s]*([\s\S]*?)(?=\n\s*(?:\n|#{1,6}\s|\b(?:experience|skills|education|work\s+experience|employment|projects|certifications|contact|references)\b))/i;
  const match = text.match(headingRegex);
  if (match && match[1].trim().length > 20) {
    return match[1].trim();
  }

  const fallback = text.replace(/^[\s\S]*?\n(?:.*?)(?:\n|$)/, '').trim();
  return fallback.length > 20
    ? fallback.slice(0, 350).trim()
    : text.slice(0, 350).trim();
}
