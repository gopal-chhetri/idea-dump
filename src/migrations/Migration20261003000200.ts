import { Migration } from '@mikro-orm/migrations';

/** Confidence reported by Jev scoring; null for rule-based scores. */
export class Migration20261003000200 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "idea_scores" add column if not exists "confidence" real null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "idea_scores" drop column if exists "confidence";`,
    );
  }
}
