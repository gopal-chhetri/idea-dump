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
exports.IdeaRankOverride = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const idea_entity_1 = require("./idea.entity");
let IdeaRankOverride = class IdeaRankOverride {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    idea;
    manualRank;
    pinned = false;
    setAt = new Date();
};
exports.IdeaRankOverride = IdeaRankOverride;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], IdeaRankOverride.prototype, "id", void 0);
__decorate([
    (0, legacy_1.OneToOne)(() => idea_entity_1.Idea, (idea) => idea.rankOverride, { owner: true }),
    __metadata("design:type", idea_entity_1.Idea)
], IdeaRankOverride.prototype, "idea", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], IdeaRankOverride.prototype, "manualRank", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'boolean' }),
    __metadata("design:type", Boolean)
], IdeaRankOverride.prototype, "pinned", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], IdeaRankOverride.prototype, "setAt", void 0);
exports.IdeaRankOverride = IdeaRankOverride = __decorate([
    (0, legacy_1.Entity)({ tableName: 'idea_rank_overrides' })
], IdeaRankOverride);
//# sourceMappingURL=idea-rank-override.entity.js.map