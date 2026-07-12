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
exports.IdeasService = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const idea_entity_1 = require("../entities/idea.entity");
const user_entity_1 = require("../entities/user.entity");
const idea_status_entity_1 = require("../entities/idea-status.entity");
const daily_idea_quota_entity_1 = require("../entities/daily-idea-quota.entity");
const DEFAULT_STATUS = 'draft';
let IdeasService = class IdeasService {
    em;
    constructor(em) {
        this.em = em;
    }
    async resolveStatus(value) {
        const status = await this.em.findOne(idea_status_entity_1.IdeaStatus, { value });
        if (!status) {
            throw new common_1.NotFoundException(`Unknown idea status: ${value}`);
        }
        return status;
    }
    async create(userId, data) {
        const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
        const status = (await this.em.findOne(idea_status_entity_1.IdeaStatus, { isDefault: true })) ??
            (await this.resolveStatus(DEFAULT_STATUS));
        const idea = this.em.create(idea_entity_1.Idea, {
            user,
            title: data.title,
            description: data.description,
            features: data.features ?? [],
            useCase: data.useCase,
            status,
        });
        this.em.persist(idea);
        await this.updateQuota(userId);
        await this.em.flush();
        return idea;
    }
    async findAllByUser(userId) {
        return this.em.find(idea_entity_1.Idea, { user: userId }, {
            populate: ['scores', 'rankOverride', 'status'],
            orderBy: { createdAt: 'DESC' },
        });
    }
    async findOne(userId, ideaId) {
        const idea = await this.em.findOne(idea_entity_1.Idea, { id: ideaId }, { populate: ['scores', 'rankOverride', 'status'] });
        if (!idea)
            throw new common_1.NotFoundException('Idea not found');
        this.assertOwnership(idea, userId);
        return idea;
    }
    async update(userId, ideaId, data) {
        const idea = await this.findOne(userId, ideaId);
        if (data.title !== undefined)
            idea.title = data.title;
        if (data.description !== undefined)
            idea.description = data.description;
        if (data.features !== undefined)
            idea.features = data.features;
        if (data.useCase !== undefined)
            idea.useCase = data.useCase;
        if (data.status !== undefined)
            idea.status = await this.resolveStatus(data.status);
        await this.em.flush();
        return idea;
    }
    async remove(userId, ideaId) {
        const idea = await this.findOne(userId, ideaId);
        this.em.remove(idea);
        await this.em.flush();
    }
    assertOwnership(idea, userId) {
        const ideaUserId = typeof idea.user === 'string' ? idea.user : idea.user.id;
        if (ideaUserId !== userId) {
            throw new common_1.ForbiddenException('Not your idea');
        }
    }
    async updateQuota(userId) {
        const today = new Date().toISOString().slice(0, 10);
        const existing = await this.em.findOne(daily_idea_quota_entity_1.DailyIdeaQuota, {
            user: userId,
            date: today,
        });
        if (existing) {
            existing.count += 1;
        }
        else {
            const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
            const quota = this.em.create(daily_idea_quota_entity_1.DailyIdeaQuota, {
                user,
                date: today,
                count: 1,
            });
            this.em.persist(quota);
        }
    }
};
exports.IdeasService = IdeasService;
exports.IdeasService = IdeasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.EntityManager])
], IdeasService);
//# sourceMappingURL=ideas.service.js.map