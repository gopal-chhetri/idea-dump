export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SkillCategory {
  LANGUAGE = 'language',
  FRAMEWORK = 'framework',
  TOOL = 'tool',
  DOMAIN = 'domain',
}

export enum IdeaStatus {
  INBOX = 'inbox',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum ScoringMethod {
  RULE_BASED = 'rule_based',
  LLM = 'llm',
}
