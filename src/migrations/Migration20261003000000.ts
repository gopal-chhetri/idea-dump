import { Migration } from '@mikro-orm/migrations';

/**
 * Cascade deletes from users and ideas to the rows that belong to them, so
 * deleting a user or an idea no longer fails on foreign-key constraints.
 */
export class Migration20261003000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "refresh_tokens" drop constraint "refresh_tokens_user_id_foreign";`,
    );
    this.addSql(
      `alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "oauth_accounts" drop constraint "oauth_accounts_user_id_foreign";`,
    );
    this.addSql(
      `alter table "oauth_accounts" add constraint "oauth_accounts_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
    this.addSql(`alter table "ideas" drop constraint "ideas_user_id_foreign";`);
    this.addSql(
      `alter table "ideas" add constraint "ideas_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "idea_scores" drop constraint "idea_scores_idea_id_foreign";`,
    );
    this.addSql(
      `alter table "idea_scores" add constraint "idea_scores_idea_id_foreign" foreign key ("idea_id") references "ideas" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "idea_rank_overrides" drop constraint "idea_rank_overrides_idea_id_foreign";`,
    );
    this.addSql(
      `alter table "idea_rank_overrides" add constraint "idea_rank_overrides_idea_id_foreign" foreign key ("idea_id") references "ideas" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "daily_idea_quotas" drop constraint "daily_idea_quotas_user_id_foreign";`,
    );
    this.addSql(
      `alter table "daily_idea_quotas" add constraint "daily_idea_quotas_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "cv_profiles" drop constraint "cv_profiles_user_id_foreign";`,
    );
    this.addSql(
      `alter table "cv_profiles" add constraint "cv_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "cv_skills" drop constraint "cv_skills_cv_profile_id_foreign";`,
    );
    this.addSql(
      `alter table "cv_skills" add constraint "cv_skills_cv_profile_id_foreign" foreign key ("cv_profile_id") references "cv_profiles" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "refresh_tokens" drop constraint "refresh_tokens_user_id_foreign";`,
    );
    this.addSql(
      `alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(
      `alter table "oauth_accounts" drop constraint "oauth_accounts_user_id_foreign";`,
    );
    this.addSql(
      `alter table "oauth_accounts" add constraint "oauth_accounts_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(`alter table "ideas" drop constraint "ideas_user_id_foreign";`);
    this.addSql(
      `alter table "ideas" add constraint "ideas_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(
      `alter table "idea_scores" drop constraint "idea_scores_idea_id_foreign";`,
    );
    this.addSql(
      `alter table "idea_scores" add constraint "idea_scores_idea_id_foreign" foreign key ("idea_id") references "ideas" ("id");`,
    );
    this.addSql(
      `alter table "idea_rank_overrides" drop constraint "idea_rank_overrides_idea_id_foreign";`,
    );
    this.addSql(
      `alter table "idea_rank_overrides" add constraint "idea_rank_overrides_idea_id_foreign" foreign key ("idea_id") references "ideas" ("id");`,
    );
    this.addSql(
      `alter table "daily_idea_quotas" drop constraint "daily_idea_quotas_user_id_foreign";`,
    );
    this.addSql(
      `alter table "daily_idea_quotas" add constraint "daily_idea_quotas_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(
      `alter table "cv_profiles" drop constraint "cv_profiles_user_id_foreign";`,
    );
    this.addSql(
      `alter table "cv_profiles" add constraint "cv_profiles_user_id_foreign" foreign key ("user_id") references "users" ("id");`,
    );
    this.addSql(
      `alter table "cv_skills" drop constraint "cv_skills_cv_profile_id_foreign";`,
    );
    this.addSql(
      `alter table "cv_skills" add constraint "cv_skills_cv_profile_id_foreign" foreign key ("cv_profile_id") references "cv_profiles" ("id");`,
    );
  }
}
