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
exports.IdeaStatus = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
const idea_entity_1 = require("./idea.entity");
let IdeaStatus = class IdeaStatus {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    value;
    label;
    sortOrder = 0;
    isDefault = false;
    createdAt = new Date();
    ideas = new core_1.Collection(this);
};
exports.IdeaStatus = IdeaStatus;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], IdeaStatus.prototype, "id", void 0);
__decorate([
    (0, legacy_1.Property)({ unique: true, type: 'string' }),
    __metadata("design:type", String)
], IdeaStatus.prototype, "value", void 0);
__decorate([
    (0, legacy_1.Property)({ nullable: true, type: 'string' }),
    __metadata("design:type", String)
], IdeaStatus.prototype, "label", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], IdeaStatus.prototype, "sortOrder", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], IdeaStatus.prototype, "isDefault", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], IdeaStatus.prototype, "createdAt", void 0);
__decorate([
    (0, legacy_1.OneToMany)(() => idea_entity_1.Idea, (idea) => idea.status),
    __metadata("design:type", Object)
], IdeaStatus.prototype, "ideas", void 0);
exports.IdeaStatus = IdeaStatus = __decorate([
    (0, legacy_1.Entity)({ tableName: 'idea_status' })
], IdeaStatus);
//# sourceMappingURL=idea-status.entity.js.map