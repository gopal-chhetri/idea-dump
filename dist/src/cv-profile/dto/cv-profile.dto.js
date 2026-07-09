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
exports.CreateCvSkillDto = exports.UpdateCvProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../entities/enums");
class UpdateCvProfileDto {
    summaryText;
}
exports.UpdateCvProfileDto = UpdateCvProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Full-stack engineer with 5 years of experience in TypeScript, NestJS, and PostgreSQL. Strong focus on distributed systems and DevOps.',
        description: 'Free-text professional summary used to calibrate idea fit scoring',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCvProfileDto.prototype, "summaryText", void 0);
class CreateCvSkillDto {
    name;
    category;
    weight;
}
exports.CreateCvSkillDto = CreateCvSkillDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'TypeScript',
        description: 'Skill or technology name',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCvSkillDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: enums_1.SkillCategory,
        example: enums_1.SkillCategory.LANGUAGE,
        description: 'Skill category — language, framework, tool, or domain',
    }),
    (0, class_validator_1.IsEnum)(enums_1.SkillCategory),
    __metadata("design:type", String)
], CreateCvSkillDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 4,
        minimum: 1,
        maximum: 5,
        description: 'Proficiency / relevance weight (1 = basic familiarity, 5 = expert)',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCvSkillDto.prototype, "weight", void 0);
//# sourceMappingURL=cv-profile.dto.js.map