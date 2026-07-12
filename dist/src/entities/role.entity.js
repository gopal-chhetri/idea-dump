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
exports.Role = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
let Role = class Role {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    value;
    name;
    isDefault = false;
    createdAt = new Date();
    users = new core_1.Collection(this);
};
exports.Role = Role;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], Role.prototype, "id", void 0);
__decorate([
    (0, legacy_1.Property)({ unique: true, type: 'string' }),
    __metadata("design:type", String)
], Role.prototype, "value", void 0);
__decorate([
    (0, legacy_1.Property)({ nullable: true, type: 'string' }),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Role.prototype, "isDefault", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Role.prototype, "createdAt", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => user_entity_1.User, (user) => user.role),
    __metadata("design:type", Object)
], Role.prototype, "users", void 0);
exports.Role = Role = __decorate([
    (0, legacy_1.Entity)({ tableName: 'roles' })
], Role);
//# sourceMappingURL=role.entity.js.map