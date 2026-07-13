"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260713000000 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20260713000000 extends migrations_1.Migration {
    up() {
        this.addSql(`create table "roles" ("id" uuid not null, "value" varchar(255) not null, "name" varchar(255) null, "is_default" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`);
        this.addSql(`alter table "roles" add constraint "roles_value_unique" unique ("value");`);
        this.addSql(`create table "idea_status" ("id" uuid not null, "value" varchar(255) not null, "label" varchar(255) null, "sort_order" int not null default 0, "is_default" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`);
        this.addSql(`alter table "idea_status" add constraint "idea_status_value_unique" unique ("value");`);
        this.addSql(`insert into "roles" ("id", "value", "name", "is_default", "created_at") values 
        (gen_random_uuid(), 'user', 'User', true, now()),
        (gen_random_uuid(), 'admin', 'Admin', false, now());`);
        this.addSql(`insert into "idea_status" ("id", "value", "label", "sort_order", "is_default", "created_at") values 
        (gen_random_uuid(), 'draft', 'Draft', 1, true, now()),
        (gen_random_uuid(), 'in_progress', 'In Progress', 2, false, now()),
        (gen_random_uuid(), 'completed', 'Completed', 3, false, now()),
        (gen_random_uuid(), 'archived', 'Archived', 4, false, now());`);
        this.addSql(`truncate table "users", "refresh_tokens", "oauth_accounts", "ideas", "idea_scores", "idea_rank_overrides", "daily_idea_quotas", "cv_profiles", "cv_skills" restart identity cascade;`);
        this.addSql(`alter table "users" add column "role_id" uuid not null;`);
        this.addSql(`alter table "users" drop constraint if exists "users_role_check";`);
        this.addSql(`alter table "users" drop column "role";`);
        this.addSql(`alter table "users" add constraint "users_role_id_foreign" foreign key ("role_id") references "roles" ("id");`);
        this.addSql(`alter table "ideas" add column "status_id" uuid not null;`);
        this.addSql(`alter table "ideas" drop constraint if exists "ideas_status_check";`);
        this.addSql(`alter table "ideas" drop column "status";`);
        this.addSql(`alter table "ideas" add constraint "ideas_status_id_foreign" foreign key ("status_id") references "idea_status" ("id");`);
    }
    down() {
        this.addSql(`alter table "ideas" drop constraint if exists "ideas_status_id_foreign";`);
        this.addSql(`alter table "ideas" drop column "status_id";`);
        this.addSql(`alter table "ideas" add column "status" text not null default 'inbox';`);
        this.addSql(`alter table "ideas" add constraint "ideas_status_check" check ("status" in ('inbox', 'active', 'archived'));`);
        this.addSql(`alter table "users" drop constraint if exists "users_role_id_foreign";`);
        this.addSql(`alter table "users" drop column "role_id";`);
        this.addSql(`alter table "users" add column "role" text not null default 'user';`);
        this.addSql(`alter table "users" add constraint "users_role_check" check ("role" in ('user', 'admin'));`);
        this.addSql(`drop table if exists "idea_status" cascade;`);
        this.addSql(`drop table if exists "roles" cascade;`);
    }
}
exports.Migration20260713000000 = Migration20260713000000;
//# sourceMappingURL=Migration20260713000000.js.map