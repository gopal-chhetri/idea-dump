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
exports.RankingService = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const idea_entity_1 = require("../entities/idea.entity");
const idea_rank_override_entity_1 = require("../entities/idea-rank-override.entity");
const enums_1 = require("../entities/enums");
let RankingService = class RankingService {
    em;
    constructor(em) {
        this.em = em;
    }
    async getRankedIdeas(userId) {
        const ideas = await this.em.find(idea_entity_1.Idea, { user: userId }, { populate: ['scores', 'rankOverride'] });
        return ideas.sort((a, b) => {
            const aPinned = a.rankOverride?.pinned ? 1 : 0;
            const bPinned = b.rankOverride?.pinned ? 1 : 0;
            if (bPinned !== aPinned)
                return bPinned - aPinned;
            const aRank = a.rankOverride?.manualRank ?? Infinity;
            const bRank = b.rankOverride?.manualRank ?? Infinity;
            if (aRank !== bRank)
                return aRank - bRank;
            const aScore = this.getLatestFinalScore(a);
            const bScore = this.getLatestFinalScore(b);
            return bScore - aScore;
        });
    }
    async setOverride(userId, ideaId, data) {
        const idea = await this.em.findOne(idea_entity_1.Idea, { id: ideaId }, { populate: ['rankOverride'] });
        if (!idea)
            throw new common_1.NotFoundException('Idea not found');
        this.assertOwnership(idea, userId);
        let override = idea.rankOverride;
        if (override) {
            if (data.manualRank !== undefined)
                override.manualRank = data.manualRank;
            if (data.pinned !== undefined)
                override.pinned = data.pinned;
            override.setAt = new Date();
        }
        else {
            override = this.em.create(idea_rank_override_entity_1.IdeaRankOverride, {
                idea,
                manualRank: data.manualRank,
                pinned: data.pinned ?? false,
            });
            this.em.persist(override);
        }
        await this.em.flush();
        return override;
    }
    async clearOverride(userId, ideaId) {
        const idea = await this.em.findOne(idea_entity_1.Idea, { id: ideaId }, { populate: ['rankOverride'] });
        if (!idea)
            throw new common_1.NotFoundException('Idea not found');
        this.assertOwnership(idea, userId);
        if (idea.rankOverride) {
            this.em.remove(idea.rankOverride);
            await this.em.flush();
        }
    }
    getLatestFinalScore(idea) {
        const scores = idea.scores?.getItems() ?? [];
        const ruleScore = scores.find((s) => s.scoringMethod === enums_1.ScoringMethod.RULE_BASED);
        return ruleScore?.finalScore ?? 0;
    }
    assertOwnership(idea, userId) {
        const ideaUserId = typeof idea.user === 'string' ? idea.user : idea.user.id;
        if (ideaUserId !== userId) {
            throw new common_1.ForbiddenException('Not your idea');
        }
    }
};
exports.RankingService = RankingService;
exports.RankingService = RankingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.EntityManager])
], RankingService);
//# sourceMappingURL=ranking.service.js.map