import { Migration } from '@mikro-orm/migrations';

export class Migration20260709112152 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "users" ("id" uuid not null, "email" varchar(255) not null, "password_hash" varchar(255) null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "refresh_tokens" ("id" uuid not null, "user_id" uuid not null, "token_hash" varchar(255) not null, "expires_at" timestamptz not null, "revoked_at" timestamptz null, "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "oauth_accounts" ("id" uuid not null, "user_id" uuid not null, "provider" text not null, "provider_account_id" varchar(255) not null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "oauth_accounts" add constraint "oauth_accounts_provider_provider_account_id_unique" unique ("provider", "provider_account_id");`,
    );

    this.addSql(
      `create table "ideas" ("id" uuid not null, "user_id" uuid not null, "title" varchar(255) not null, "description" text not null, "features" jsonb not null, "use_case" text not null, "status" text not null default 'inbox', "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "idea_scores" ("id" uuid not null, "idea_id" uuid not null, "fit_score" real not null, "effort_score" real not null, "novelty_score" real not null, "final_score" real not null, "scoring_method" text not null, "scored_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "idea_rank_overrides" ("id" uuid not null, "idea_id" uuid not null, "manual_rank" int null, "pinned" boolean not null default false, "set_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "idea_rank_overrides" add constraint "idea_rank_overrides_idea_id_unique" unique ("idea_id");`,
    );

    this.addSql(
      `create table "daily_idea_quotas" ("id" uuid not null, "user_id" uuid not null, "date" date not null, "count" int not null default 1, primary key ("id"));`,
    );
    this.addSql(
      `alter table "daily_idea_quotas" add constraint "daily_idea_quotas_user_id_date_unique" unique ("user_id", "date");`,
    );

    this.addSql(
      `create table "cv_profiles" ("id" uuid not null, "user_id" uuid not null, "summary_text" text not null default '', "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "cv_profiles" add constraint "cv_profiles_user_id_unique" unique ("user_id");`,
    );

    this.addSql(
      `create table "cv_skills" ("id" uuid not null, "cv_profile_id" uuid not null, "name" varchar(255) not null, "category" text not null, "weight" smallint not null default 3, primary key ("id"));`,
    );

    this.addSql(
      `alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );

    this.addSql(
      `alter table "oauth_accounts" add constraint "oauth_accounts_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(
      `alter table "oauth_accounts" add constraint "oauth_accounts_provider_check" check ("provider" in ('google', 'github'));`,
    );

    this.addSql(
      `alter table "ideas" add constraint "ideas_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(
      `alter table "ideas" add constraint "ideas_status_check" check ("status" in ('inbox', 'active', 'archived'));`,
    );

    this.addSql(
      `alter table "idea_scores" add constraint "idea_scores_idea_id_foreign" foreign key ("idea_id") references "ideas" ("id");`,
    );
    this.addSql(
      `alter table "idea_scores" add constraint "idea_scores_scoring_method_check" check ("scoring_method" in ('rule_based', 'llm'));`,
    );

    this.addSql(
      `alter table "idea_rank_overrides" add constraint "idea_rank_overrides_idea_id_foreign" foreign key ("idea_id") references "ideas" ("id");`,
    );

    this.addSql(
      `alter table "daily_idea_quotas" add constraint "daily_idea_quotas_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );

    this.addSql(
      `alter table "cv_profiles" add constraint "cv_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );

    this.addSql(
      `alter table "cv_skills" add constraint "cv_skills_cv_profile_id_foreign" foreign key ("cv_profile_id") references "cv_profiles" ("id");`,
    );
    this.addSql(
      `alter table "cv_skills" add constraint "cv_skills_category_check" check ("category" in ('language', 'framework', 'tool', 'domain'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "refresh_tokens" drop constraint "refresh_tokens_user_id_foreign";`,
    );
    this.addSql(
      `alter table "oauth_accounts" drop constraint "oauth_accounts_user_id_foreign";`,
    );
    this.addSql(`alter table "ideas" drop constraint "ideas_user_id_foreign";`);
    this.addSql(
      `alter table "daily_idea_quotas" drop constraint "daily_idea_quotas_user_id_foreign";`,
    );
    this.addSql(
      `alter table "cv_profiles" drop constraint "cv_profiles_user_id_foreign";`,
    );
    this.addSql(
      `alter table "idea_scores" drop constraint "idea_scores_idea_id_foreign";`,
    );
    this.addSql(
      `alter table "idea_rank_overrides" drop constraint "idea_rank_overrides_idea_id_foreign";`,
    );
    this.addSql(
      `alter table "cv_skills" drop constraint "cv_skills_cv_profile_id_foreign";`,
    );

    this.addSql(`drop table if exists "users" cascade;`);
    this.addSql(`drop table if exists "refresh_tokens" cascade;`);
    this.addSql(`drop table if exists "oauth_accounts" cascade;`);
    this.addSql(`drop table if exists "ideas" cascade;`);
    this.addSql(`drop table if exists "idea_scores" cascade;`);
    this.addSql(`drop table if exists "idea_rank_overrides" cascade;`);
    this.addSql(`drop table if exists "daily_idea_quotas" cascade;`);
    this.addSql(`drop table if exists "cv_profiles" cascade;`);
    this.addSql(`drop table if exists "cv_skills" cascade;`);
  }
}
