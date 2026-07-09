"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringMethod = exports.IdeaStatus = exports.SkillCategory = exports.OAuthProvider = void 0;
var OAuthProvider;
(function (OAuthProvider) {
    OAuthProvider["GOOGLE"] = "google";
    OAuthProvider["GITHUB"] = "github";
})(OAuthProvider || (exports.OAuthProvider = OAuthProvider = {}));
var SkillCategory;
(function (SkillCategory) {
    SkillCategory["LANGUAGE"] = "language";
    SkillCategory["FRAMEWORK"] = "framework";
    SkillCategory["TOOL"] = "tool";
    SkillCategory["DOMAIN"] = "domain";
})(SkillCategory || (exports.SkillCategory = SkillCategory = {}));
var IdeaStatus;
(function (IdeaStatus) {
    IdeaStatus["INBOX"] = "inbox";
    IdeaStatus["ACTIVE"] = "active";
    IdeaStatus["ARCHIVED"] = "archived";
})(IdeaStatus || (exports.IdeaStatus = IdeaStatus = {}));
var ScoringMethod;
(function (ScoringMethod) {
    ScoringMethod["RULE_BASED"] = "rule_based";
    ScoringMethod["LLM"] = "llm";
})(ScoringMethod || (exports.ScoringMethod = ScoringMethod = {}));
//# sourceMappingURL=enums.js.map