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
exports.User = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const oauth_account_entity_1 = require("./oauth-account.entity");
const refresh_token_entity_1 = require("./refresh-token.entity");
const cv_profile_entity_1 = require("./cv-profile.entity");
const idea_entity_1 = require("./idea.entity");
let User = class User {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    email;
    passwordHash;
    createdAt = new Date();
    oauthAccounts = new core_1.Collection(this);
    refreshTokens = new core_1.Collection(this);
    cvProfile;
    ideas = new core_1.Collection(this);
};
exports.User = User;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, legacy_1.Property)({ unique: true, type: 'string' }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, legacy_1.Property)({ nullable: true, type: 'string' }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => oauth_account_entity_1.OAuthAccount, (account) => account.user),
    __metadata("design:type", Object)
], User.prototype, "oauthAccounts", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => refresh_token_entity_1.RefreshToken, (token) => token.user),
    __metadata("design:type", Object)
], User.prototype, "refreshTokens", void 0);
__decorate([
    (0, legacy_1.OneToOne)(() => cv_profile_entity_1.CvProfile, (profile) => profile.user, {
        nullable: true,
        orphanRemoval: true,
    }),
    __metadata("design:type", cv_profile_entity_1.CvProfile)
], User.prototype, "cvProfile", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => idea_entity_1.Idea, (idea) => idea.user),
    __metadata("design:type", Object)
], User.prototype, "ideas", void 0);
exports.User = User = __decorate([
    (0, legacy_1.Entity)({ tableName: 'users' })
], User);
//# sourceMappingURL=user.entity.js.map