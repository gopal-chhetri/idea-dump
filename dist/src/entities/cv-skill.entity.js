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
exports.CvSkill = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const cv_profile_entity_1 = require("./cv-profile.entity");
const enums_1 = require("./enums");
let CvSkill = class CvSkill {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    cvProfile;
    name;
    category;
    weight = 3;
};
exports.CvSkill = CvSkill;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], CvSkill.prototype, "id", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => cv_profile_entity_1.CvProfile),
    __metadata("design:type", cv_profile_entity_1.CvProfile)
], CvSkill.prototype, "cvProfile", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'string' }),
    __metadata("design:type", String)
], CvSkill.prototype, "name", void 0);
__decorate([
    (0, legacy_1.Enum)({ items: () => enums_1.SkillCategory }),
    __metadata("design:type", String)
], CvSkill.prototype, "category", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'smallint' }),
    __metadata("design:type", Number)
], CvSkill.prototype, "weight", void 0);
exports.CvSkill = CvSkill = __decorate([
    (0, legacy_1.Entity)({ tableName: 'cv_skills' })
], CvSkill);
//# sourceMappingURL=cv-skill.entity.js.map