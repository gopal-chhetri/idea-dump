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
exports.IdeaScore = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const idea_entity_1 = require("./idea.entity");
const enums_1 = require("./enums");
let IdeaScore = class IdeaScore {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    idea;
    fitScore;
    effortScore;
    noveltyScore;
    finalScore;
    scoringMethod;
    scoredAt = new Date();
};
exports.IdeaScore = IdeaScore;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], IdeaScore.prototype, "id", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => idea_entity_1.Idea),
    __metadata("design:type", idea_entity_1.Idea)
], IdeaScore.prototype, "idea", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'float' }),
    __metadata("design:type", Number)
], IdeaScore.prototype, "fitScore", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'float' }),
    __metadata("design:type", Number)
], IdeaScore.prototype, "effortScore", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'float' }),
    __metadata("design:type", Number)
], IdeaScore.prototype, "noveltyScore", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'float' }),
    __metadata("design:type", Number)
], IdeaScore.prototype, "finalScore", void 0);
__decorate([
    (0, legacy_1.Enum)({ items: () => enums_1.ScoringMethod }),
    __metadata("design:type", String)
], IdeaScore.prototype, "scoringMethod", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], IdeaScore.prototype, "scoredAt", void 0);
exports.IdeaScore = IdeaScore = __decorate([
    (0, legacy_1.Entity)({ tableName: 'idea_scores' })
], IdeaScore);
//# sourceMappingURL=idea-score.entity.js.map