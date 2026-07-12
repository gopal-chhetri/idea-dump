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
exports.Idea = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
const idea_status_entity_1 = require("./idea-status.entity");
const idea_score_entity_1 = require("./idea-score.entity");
const idea_rank_override_entity_1 = require("./idea-rank-override.entity");
let Idea = class Idea {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    user;
    title;
    description;
    features = [];
    useCase;
    status;
    createdAt = new Date();
    scores = new core_1.Collection(this);
    rankOverride;
};
exports.Idea = Idea;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], Idea.prototype, "id", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], Idea.prototype, "user", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'string' }),
    __metadata("design:type", String)
], Idea.prototype, "title", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'text' }),
    __metadata("design:type", String)
], Idea.prototype, "description", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'json' }),
    __metadata("design:type", Array)
], Idea.prototype, "features", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'text' }),
    __metadata("design:type", String)
], Idea.prototype, "useCase", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => idea_status_entity_1.IdeaStatus),
    __metadata("design:type", idea_status_entity_1.IdeaStatus)
], Idea.prototype, "status", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Idea.prototype, "createdAt", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => idea_score_entity_1.IdeaScore, (score) => score.idea, { orphanRemoval: true }),
    __metadata("design:type", Object)
], Idea.prototype, "scores", void 0);
__decorate([
    (0, legacy_1.OneToOne)(() => idea_rank_override_entity_1.IdeaRankOverride, (override) => override.idea, {
        nullable: true,
        orphanRemoval: true,
    }),
    __metadata("design:type", idea_rank_override_entity_1.IdeaRankOverride)
], Idea.prototype, "rankOverride", void 0);
exports.Idea = Idea = __decorate([
    (0, legacy_1.Entity)({ tableName: 'ideas' })
], Idea);
//# sourceMappingURL=idea.entity.js.map