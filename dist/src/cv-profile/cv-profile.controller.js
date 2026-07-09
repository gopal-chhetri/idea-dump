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
exports.CvProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const cv_profile_service_1 = require("./cv-profile.service");
const cv_profile_dto_1 = require("./dto/cv-profile.dto");
let CvProfileController = class CvProfileController {
    cvProfileService;
    constructor(cvProfileService) {
        this.cvProfileService = cvProfileService;
    }
    async getProfile(req) {
        const userId = req.user.id;
        return this.cvProfileService.getProfile(userId);
    }
    async upsertProfile(req, dto) {
        const userId = req.user.id;
        return this.cvProfileService.upsertProfile(userId, dto.summaryText);
    }
    async addSkill(req, dto) {
        const userId = req.user.id;
        return this.cvProfileService.addSkill(userId, dto.name, dto.category, dto.weight);
    }
    async removeSkill(req, skillId) {
        const userId = req.user.id;
        return this.cvProfileService.removeSkill(userId, skillId);
    }
};
exports.CvProfileController = CvProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get CV profile',
        description: 'Returns the user professional summary and calibrated skills.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The CV profile (may be null if not yet created).',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Upsert CV summary',
        description: 'Creates or replaces the professional summary text used to calibrate idea scoring.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated CV profile.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_profile_dto_1.UpdateCvProfileDto]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "upsertProfile", null);
__decorate([
    (0, common_1.Post)('skills'),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a skill',
        description: 'Adds a skill/category with a proficiency weight (1-5) used for fit scoring.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Skill created.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_profile_dto_1.CreateCvSkillDto]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "addSkill", null);
__decorate([
    (0, common_1.Delete)('skills/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Remove a skill',
        description: 'Deletes a skill from the CV profile.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Skill UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Skill removed.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid bearer token.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Skill not found.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "removeSkill", null);
exports.CvProfileController = CvProfileController = __decorate([
    (0, swagger_1.ApiTags)('CV Profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('cv-profile'),
    __metadata("design:paramtypes", [cv_profile_service_1.CvProfileService])
], CvProfileController);
//# sourceMappingURL=cv-profile.controller.js.map