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
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_profile_dto_1.UpdateCvProfileDto]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "upsertProfile", null);
__decorate([
    (0, common_1.Post)('skills'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cv_profile_dto_1.CreateCvSkillDto]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "addSkill", null);
__decorate([
    (0, common_1.Delete)('skills/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CvProfileController.prototype, "removeSkill", null);
exports.CvProfileController = CvProfileController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('cv-profile'),
    __metadata("design:paramtypes", [cv_profile_service_1.CvProfileService])
], CvProfileController);
//# sourceMappingURL=cv-profile.controller.js.map