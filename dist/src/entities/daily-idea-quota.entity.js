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
exports.DailyIdeaQuota = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const user_entity_1 = require("./user.entity");
let DailyIdeaQuota = class DailyIdeaQuota {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    user;
    date;
    count = 1;
};
exports.DailyIdeaQuota = DailyIdeaQuota;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], DailyIdeaQuota.prototype, "id", void 0);
__decorate([
    (0, legacy_1.ManyToOne)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], DailyIdeaQuota.prototype, "user", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'date' }),
    __metadata("design:type", String)
], DailyIdeaQuota.prototype, "date", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'int' }),
    __metadata("design:type", Number)
], DailyIdeaQuota.prototype, "count", void 0);
exports.DailyIdeaQuota = DailyIdeaQuota = __decorate([
    (0, legacy_1.Entity)({ tableName: 'daily_idea_quotas' }),
    (0, legacy_1.Unique)({ properties: ['user', 'date'] })
], DailyIdeaQuota);
//# sourceMappingURL=daily-idea-quota.entity.js.map