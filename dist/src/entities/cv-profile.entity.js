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
exports.CvProfile = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
const cv_skill_entity_1 = require("./cv-skill.entity");
let CvProfile = class CvProfile {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    user;
    summaryText = '';
    updatedAt = new Date();
    skills = new core_1.Collection(this);
};
exports.CvProfile = CvProfile;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], CvProfile.prototype, "id", void 0);
__decorate([
    (0, legacy_1.OneToOne)(() => user_entity_1.User, (user) => user.cvProfile, { owner: true }),
    __metadata("design:type", user_entity_1.User)
], CvProfile.prototype, "user", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], CvProfile.prototype, "summaryText", void 0);
__decorate([
    (0, legacy_1.Property)({ onUpdate: () => new Date(), type: 'datetime' }),
    __metadata("design:type", Date)
], CvProfile.prototype, "updatedAt", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => cv_skill_entity_1.CvSkill, (skill) => skill.cvProfile, {
        orphanRemoval: true,
    }),
    __metadata("design:type", Object)
], CvProfile.prototype, "skills", void 0);
exports.CvProfile = CvProfile = __decorate([
    (0, legacy_1.Entity)({ tableName: 'cv_profiles' })
], CvProfile);
//# sourceMappingURL=cv-profile.entity.js.map