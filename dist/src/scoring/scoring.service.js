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
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const idea_entity_1 = require("../entities/idea.entity");
const idea_score_entity_1 = require("../entities/idea-score.entity");
const cv_profile_entity_1 = require("../entities/cv-profile.entity");
const enums_1 = require("../entities/enums");
const rule_based_scoring_strategy_1 = require("./strategies/rule-based-scoring.strategy");
let ScoringService = class ScoringService {
    em;
    ruleBasedStrategy;
    wFit;
    wEffort;
    wNovelty;
    constructor(em, ruleBasedStrategy) {
        this.em = em;
        this.ruleBasedStrategy = ruleBasedStrategy;
        this.wFit = Number(process.env.SCORE_WEIGHT_FIT) || 0.5;
        this.wEffort = Number(process.env.SCORE_WEIGHT_EFFORT) || 0.3;
        this.wNovelty = Number(process.env.SCORE_WEIGHT_NOVELTY) || 0.2;
    }
    async scoreIdea(ideaId, userId) {
        const idea = await this.em.findOne(idea_entity_1.Idea, { id: ideaId });
        if (!idea)
            throw new common_1.NotFoundException('Idea not found');
        const profile = await this.em.findOne(cv_profile_entity_1.CvProfile, { user: userId }, { populate: ['skills'] });
        const userIdeas = await this.em.find(idea_entity_1.Idea, { user: userId });
        const scoringProfile = profile ?? this.em.create(cv_profile_entity_1.CvProfile, {
            user: userId,
            summaryText: '',
        });
        const result = await this.ruleBasedStrategy.score(idea, scoringProfile, userIdeas);
        const finalScore = this.wFit * result.fitScore +
            this.wEffort * (100 - result.effortScore) +
            this.wNovelty * result.noveltyScore;
        let ideaScore = await this.em.findOne(idea_score_entity_1.IdeaScore, {
            idea: ideaId,
            scoringMethod: enums_1.ScoringMethod.RULE_BASED,
        });
        if (ideaScore) {
            ideaScore.fitScore = result.fitScore;
            ideaScore.effortScore = result.effortScore;
            ideaScore.noveltyScore = result.noveltyScore;
            ideaScore.finalScore = finalScore;
            ideaScore.scoredAt = new Date();
        }
        else {
            ideaScore = this.em.create(idea_score_entity_1.IdeaScore, {
                idea,
                fitScore: result.fitScore,
                effortScore: result.effortScore,
                noveltyScore: result.noveltyScore,
                finalScore,
                scoringMethod: enums_1.ScoringMethod.RULE_BASED,
            });
            this.em.persist(ideaScore);
        }
        await this.em.flush();
        return ideaScore;
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.EntityManager,
        rule_based_scoring_strategy_1.RuleBasedScoringStrategy])
], ScoringService);
//# sourceMappingURL=scoring.service.js.map