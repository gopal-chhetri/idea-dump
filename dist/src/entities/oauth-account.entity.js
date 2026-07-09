"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthAccount = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
const enums_1 = require("./enums");
let OAuthAccount = class OAuthAccount {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    user;
    provider;
    providerAccountId;
    createdAt = new Date();
};
exports.OAuthAccount = OAuthAccount;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "id", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], OAuthAccount.prototype, "user", void 0);
__decorate([
    (0, legacy_1.Enum)({ items: () => enums_1.OAuthProvider }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "provider", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'string' }),
    __metadata("design:type", String)
], OAuthAccount.prototype, "providerAccountId", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], OAuthAccount.prototype, "createdAt", void 0);
exports.OAuthAccount = OAuthAccount = __decorate([
    (0, legacy_1.Entity)({ tableName: 'oauth_accounts' }),
    (0, legacy_1.Unique)({ properties: ['provider', 'providerAccountId'] })
], OAuthAccount);
//# sourceMappingURL=oauth-account.entity.js.map