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
exports.CvProfileService = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const cv_profile_entity_1 = require("../entities/cv-profile.entity");
const cv_skill_entity_1 = require("../entities/cv-skill.entity");
const user_entity_1 = require("../entities/user.entity");
let CvProfileService = class CvProfileService {
    em;
    constructor(em) {
        this.em = em;
    }
    async getProfile(userId) {
        return this.em.findOne(cv_profile_entity_1.CvProfile, { user: userId }, { populate: ['skills'] });
    }
    async upsertProfile(userId, summaryText) {
        let profile = await this.em.findOne(cv_profile_entity_1.CvProfile, { user: userId });
        if (profile) {
            profile.summaryText = summaryText;
        }
        else {
            const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
            profile = this.em.create(cv_profile_entity_1.CvProfile, { user, summaryText });
            this.em.persist(profile);
        }
        await this.em.flush();
        return this.em.findOneOrFail(cv_profile_entity_1.CvProfile, { id: profile.id }, { populate: ['skills'] });
    }
    async addSkill(userId, name, category, weight) {
        let profile = await this.em.findOne(cv_profile_entity_1.CvProfile, { user: userId });
        if (!profile) {
            const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
            profile = this.em.create(cv_profile_entity_1.CvProfile, { user, summaryText: '' });
            this.em.persist(profile);
            await this.em.flush();
        }
        const skill = this.em.create(cv_skill_entity_1.CvSkill, {
            cvProfile: profile,
            name,
            category,
            ...(weight !== undefined ? { weight } : {}),
        });
        this.em.persist(skill);
        await this.em.flush();
        return skill;
    }
    async removeSkill(userId, skillId) {
        const skill = await this.em.findOne(cv_skill_entity_1.CvSkill, { id: skillId }, { populate: ['cvProfile'] });
        if (!skill) {
            throw new common_1.NotFoundException('Skill not found');
        }
        const profile = await this.em.findOneOrFail(cv_profile_entity_1.CvProfile, { id: skill.cvProfile.id }, { populate: ['user'] });
        if (profile.user.id !== userId) {
            throw new common_1.ForbiddenException('Not your skill');
        }
        this.em.remove(skill);
        await this.em.flush();
    }
};
exports.CvProfileService = CvProfileService;
exports.CvProfileService = CvProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.EntityManager])
], CvProfileService);
//# sourceMappingURL=cv-profile.service.js.map