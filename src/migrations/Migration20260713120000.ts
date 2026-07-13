import { Migration } from '@mikro-orm/migrations';

export class Migration20260713120000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "system_settings" ("id" uuid not null default gen_random_uuid(), "key" varchar(255) not null, "value" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), primary key ("id"));`,
    );
    this.addSql(
      `alter table "system_settings" add constraint "system_settings_key_unique" unique ("key");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "system_settings" cascade;`);
  }
}
