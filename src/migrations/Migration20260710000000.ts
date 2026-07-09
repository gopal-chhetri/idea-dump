import { Migration } from '@mikro-orm/migrations';

export class Migration20260710000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "users" add column "role" text not null default 'user';`,
    );
    this.addSql(
      `alter table "users" add constraint "users_role_check" check ("role" in ('user', 'admin'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "users" drop constraint "users_role_check";`);
    this.addSql(`alter table "users" drop column "role";`);
  }
}
