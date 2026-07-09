"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260710000000 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20260710000000 extends migrations_1.Migration {
    up() {
        this.addSql(`alter table "users" add column "role" text not null default 'user';`);
        this.addSql(`alter table "users" add constraint "users_role_check" check ("role" in ('user', 'admin'));`);
    }
    down() {
        this.addSql(`alter table "users" drop constraint "users_role_check";`);
        this.addSql(`alter table "users" drop column "role";`);
    }
}
exports.Migration20260710000000 = Migration20260710000000;
//# sourceMappingURL=Migration20260710000000.js.map