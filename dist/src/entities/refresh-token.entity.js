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
exports.RefreshToken = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
let RefreshToken = class RefreshToken {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    user;
    tokenHash;
    expiresAt;
    revokedAt;
    createdAt = new Date();
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], RefreshToken.prototype, "id", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], RefreshToken.prototype, "user", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'string' }),
    __metadata("design:type", String)
], RefreshToken.prototype, "tokenHash", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expiresAt", void 0);
__decorate([
    (0, legacy_1.Property)({ nullable: true, type: 'datetime' }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "revokedAt", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "createdAt", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, legacy_1.Entity)({ tableName: 'refresh_tokens' })
], RefreshToken);
//# sourceMappingURL=refresh-token.entity.js.map