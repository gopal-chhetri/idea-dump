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
exports.UpdateIdeaDto = exports.CreateIdeaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../entities/enums");
class CreateIdeaDto {
    title;
    description;
    features;
    useCase;
}
exports.CreateIdeaDto = CreateIdeaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'AI-powered Code Review Bot',
        description: 'Short, memorable idea title',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIdeaDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'A GitHub App that uses LLMs to perform contextual code review, flag bugs, and suggest improvements.',
        description: 'Full problem statement and value proposition',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIdeaDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: [
            'PR diff analysis',
            'LLM integration',
            'GitHub Actions',
            'Rate limiting',
        ],
        description: 'Key features or capabilities (comma-separated in UI)',
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateIdeaDto.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Software teams wanting automated, AI-assisted code review without switching tools.',
        description: 'Who benefits and how this demonstrates engineering capability',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIdeaDto.prototype, "useCase", void 0);
class UpdateIdeaDto {
    title;
    description;
    features;
    useCase;
    status;
}
exports.UpdateIdeaDto = UpdateIdeaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated Title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIdeaDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated description text' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIdeaDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['Feature A', 'Feature B'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateIdeaDto.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated use case description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIdeaDto.prototype, "useCase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: enums_1.IdeaStatus,
        example: enums_1.IdeaStatus.ACTIVE,
        description: 'Workflow status of the idea',
    }),
    (0, class_validator_1.IsEnum)(enums_1.IdeaStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIdeaDto.prototype, "status", void 0);
//# sourceMappingURL=idea.dto.js.map