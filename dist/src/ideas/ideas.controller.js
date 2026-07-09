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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdeasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const rate_limit_guard_1 = require("../rate-limit/rate-limit.guard");
const ideas_service_1 = require("./ideas.service");
const scoring_service_1 = require("../scoring/scoring.service");
const ranking_service_1 = require("../ranking/ranking.service");
const idea_dto_1 = require("./dto/idea.dto");
const update_rank_dto_1 = require("../ranking/dto/update-rank.dto");
let IdeasController = class IdeasController {
    ideasService;
    scoringService;
    rankingService;
    constructor(ideasService, scoringService, rankingService) {
        this.ideasService = ideasService;
        this.scoringService = scoringService;
        this.rankingService = rankingService;
    }
    async create(req, dto) {
        const userId = req.user.id;
        const idea = await this.ideasService.create(userId, dto);
        await this.scoringService.scoreIdea(idea.id, userId);
        return this.ideasService.findOne(userId, idea.id);
    }
    async findAll(req) {
        const userId = req.user.id;
        return this.rankingService.getRankedIdeas(userId);
    }
    async findOne(req, ideaId) {
        const userId = req.user.id;
        return this.ideasService.findOne(userId, ideaId);
    }
    async update(req, ideaId, dto) {
        const userId = req.user.id;
        return this.ideasService.update(userId, ideaId, dto);
    }
    async remove(req, ideaId) {
        const userId = req.user.id;
        await this.ideasService.remove(userId, ideaId);
        return { deleted: true };
    }
    async rescore(req, ideaId) {
        const userId = req.user.id;
        await this.scoringService.scoreIdea(ideaId, userId);
        return this.ideasService.findOne(userId, ideaId);
    }
    async updateRank(req, ideaId, dto) {
        const userId = req.user.id;
        return this.rankingService.setOverride(userId, ideaId, dto);
    }
    async clearRank(req, ideaId) {
        const userId = req.user.id;
        await this.rankingService.clearOverride(userId, ideaId);
        return { cleared: true };
    }
};
exports.IdeasController = IdeasController;
__decorate([
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, idea_dto_1.CreateIdeaDto]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, idea_dto_1.UpdateIdeaDto]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/rescore'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "rescore", null);
__decorate([
    (0, common_1.Patch)(':id/rank'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_rank_dto_1.UpdateRankDto]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "updateRank", null);
__decorate([
    (0, common_1.Delete)(':id/rank'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "clearRank", null);
exports.IdeasController = IdeasController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ideas'),
    __metadata("design:paramtypes", [ideas_service_1.IdeasService,
        scoring_service_1.ScoringService,
        ranking_service_1.RankingService])
], IdeasController);
//# sourceMappingURL=ideas.controller.js.map