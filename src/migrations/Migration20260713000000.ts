import { Migration } from '@mikro-orm/migrations';

export class Migration20260713000000 extends Migration {
  override up(): void | Promise<void> {
    // ── Lookup tables ──────────────────────────────────
    this.addSql(
      `create table "roles" ("id" uuid not null, "value" varchar(255) not null, "name" varchar(255) null, "is_default" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "roles" add constraint "roles_value_unique" unique ("value");`,
    );

    this.addSql(
      `create table "idea_status" ("id" uuid not null, "value" varchar(255) not null, "label" varchar(255) null, "sort_order" int not null default 0, "is_default" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "idea_status" add constraint "idea_status_value_unique" unique ("value");`,
    );

    // ── Clean slate: wipe previous data ────────────────
    this.addSql(
      `truncate table "users", "refresh_tokens", "oauth_accounts", "ideas", "idea_scores", "idea_rank_overrides", "daily_idea_quotas", "cv_profiles", "cv_skills" restart identity cascade;`,
    );

    // ── users.role → role_id FK ────────────────────────
    this.addSql(`alter table "users" add column "role_id" uuid not null;`);
    this.addSql(
      `alter table "users" drop constraint if exists "users_role_check";`,
    );
    this.addSql(`alter table "users" drop column "role";`);
    this.addSql(
      `alter table "users" add constraint "users_role_id_foreign" foreign key ("role_id") references "roles" ("id");`,
    );

    // ── ideas.status → status_id FK ───────────────────
    this.addSql(`alter table "ideas" add column "status_id" uuid not null;`);
    this.addSql(
      `alter table "ideas" drop constraint if exists "ideas_status_check";`,
    );
    this.addSql(`alter table "ideas" drop column "status";`);
    this.addSql(
      `alter table "ideas" add constraint "ideas_status_id_foreign" foreign key ("status_id") references "idea_status" ("id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "ideas" drop constraint if exists "ideas_status_id_foreign";`,
    );
    this.addSql(`alter table "ideas" drop column "status_id";`);
    this.addSql(
      `alter table "ideas" add column "status" text not null default 'inbox';`,
    );
    this.addSql(
      `alter table "ideas" add constraint "ideas_status_check" check ("status" in ('inbox', 'active', 'archived'));`,
    );

    this.addSql(
      `alter table "users" drop constraint if exists "users_role_id_foreign";`,
    );
    this.addSql(`alter table "users" drop column "role_id";`);
    this.addSql(
      `alter table "users" add column "role" text not null default 'user';`,
    );
    this.addSql(
      `alter table "users" add constraint "users_role_check" check ("role" in ('user', 'admin'));`,
    );

    this.addSql(`drop table if exists "idea_status" cascade;`);
    this.addSql(`drop table if exists "roles" cascade;`);
  }
}
