import { Migration } from '@mikro-orm/migrations';

/**
 * Emails are now normalised to trimmed lower case on write and lookup.
 * Normalise existing rows to match, skipping any that would collide with
 * another account (those need manual merging).
 */
export class Migration20261003000100 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `update "users" u set "email" = lower(trim(u."email")) where u."email" <> lower(trim(u."email")) and not exists (select 1 from "users" o where o."id" <> u."id" and o."email" = lower(trim(u."email")));`,
    );
  }

  override down(): void | Promise<void> {
    // Original casing is not recoverable; lower-case emails remain valid.
  }
}
