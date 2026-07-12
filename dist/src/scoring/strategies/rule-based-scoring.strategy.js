"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleBasedScoringStrategy = void 0;
const common_1 = require("@nestjs/common");
let RuleBasedScoringStrategy = class RuleBasedScoringStrategy {
    score(idea, profile, userIdeas) {
        const fitScore = this.computeFitScore(idea, profile);
        const effortScore = this.computeEffortScore(idea);
        const noveltyScore = this.computeNoveltyScore(idea, userIdeas);
        return Promise.resolve({ fitScore, effortScore, noveltyScore });
    }
    computeFitScore(idea, profile) {
        const skills = profile.skills?.getItems() ?? [];
        if (skills.length === 0)
            return 50;
        const ideaTokens = this.tokenize(`${idea.description} ${idea.features.join(' ')} ${idea.useCase}`);
        if (ideaTokens.size === 0)
            return 0;
        let weightedMatches = 0;
        let maxPossibleWeight = 0;
        for (const skill of skills) {
            maxPossibleWeight += skill.weight;
            const skillTokens = this.tokenize(skill.name);
            for (const st of skillTokens) {
                if (ideaTokens.has(st)) {
                    weightedMatches += skill.weight;
                    break;
                }
            }
        }
        if (maxPossibleWeight === 0)
            return 50;
        return Math.round((weightedMatches / maxPossibleWeight) * 100);
    }
    computeEffortScore(idea) {
        const featureCount = idea.features.length;
        const descLength = idea.description.length;
        const featurePenalty = Math.min(featureCount * 10, 60);
        const lengthPenalty = Math.min(Math.floor(descLength / 50), 40);
        return Math.max(0, 100 - featurePenalty - lengthPenalty);
    }
    computeNoveltyScore(idea, userIdeas) {
        const otherIdeas = userIdeas.filter((i) => i.id !== idea.id);
        if (otherIdeas.length === 0)
            return 100;
        const ideaTokens = this.tokenize(`${idea.title} ${idea.description} ${idea.features.join(' ')} ${idea.useCase}`);
        if (ideaTokens.size === 0)
            return 100;
        let totalDistance = 0;
        for (const other of otherIdeas) {
            const otherTokens = this.tokenize(`${other.title} ${other.description} ${other.features.join(' ')} ${other.useCase}`);
            const intersection = new Set([...ideaTokens].filter((t) => otherTokens.has(t)));
            const union = new Set([...ideaTokens, ...otherTokens]);
            const jaccard = union.size > 0 ? intersection.size / union.size : 0;
            totalDistance += 1 - jaccard;
        }
        return Math.round((totalDistance / otherIdeas.length) * 100);
    }
    tokenize(text) {
        return new Set(text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 1));
    }
};
exports.RuleBasedScoringStrategy = RuleBasedScoringStrategy;
exports.RuleBasedScoringStrategy = RuleBasedScoringStrategy = __decorate([
    (0, common_1.Injectable)()
], RuleBasedScoringStrategy);
//# sourceMappingURL=rule-based-scoring.strategy.js.map