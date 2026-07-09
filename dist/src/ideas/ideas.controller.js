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
const swagger_1 = require("@nestjs/swagger");
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
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new idea',
        description: 'Captures a project idea and auto-scores it against the user CV profile. Subject to the daily idea quota.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Idea created and scored.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Daily idea quota reached.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, idea_dto_1.CreateIdeaDto]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List ranked ideas',
        description: 'Returns the user ideas ordered by pinned, manual rank, then computed score.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ranked list of ideas.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a single idea',
        description: 'Returns one idea with its scores and rank override.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Idea UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The requested idea.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Idea not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update an idea',
        description: 'Updates mutable fields of an idea (title, description, features, use case, status).',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Idea UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated idea.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Idea not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, idea_dto_1.UpdateIdeaDto]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete an idea',
        description: 'Permanently removes an idea and its scores/overrides.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Idea UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Idea deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Idea not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/rescore'),
    (0, swagger_1.ApiOperation)({
        summary: 'Re-score an idea',
        description: 'Recomputes the score for an idea against the current CV profile.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Idea UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Idea with recomputed scores.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Idea not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "rescore", null);
__decorate([
    (0, common_1.Patch)(':id/rank'),
    (0, swagger_1.ApiOperation)({
        summary: 'Set ranking override',
        description: 'Pins an idea to the top or forces it to a specific manual rank position.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Idea UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ranking override applied.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Idea not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_rank_dto_1.UpdateRankDto]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "updateRank", null);
__decorate([
    (0, common_1.Delete)(':id/rank'),
    (0, swagger_1.ApiOperation)({
        summary: 'Clear ranking override',
        description: 'Removes any pin/manual-rank override so the idea falls back to computed scoring.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Idea UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ranking override cleared.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Idea not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IdeasController.prototype, "clearRank", null);
exports.IdeasController = IdeasController = __decorate([
    (0, swagger_1.ApiTags)('Ideas'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ideas'),
    __metadata("design:paramtypes", [ideas_service_1.IdeasService,
        scoring_service_1.ScoringService,
        ranking_service_1.RankingService])
], IdeasController);
//# sourceMappingURL=ideas.controller.js.map