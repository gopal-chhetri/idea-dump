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
exports.SystemSetting = void 0;
const core_1 = require("@mikro-orm/core");
const legacy_1 = require("@mikro-orm/decorators/legacy");
const uuid_1 = require("uuid");
let SystemSetting = class SystemSetting {
    [core_1.OptionalProps];
    id = (0, uuid_1.v4)();
    key;
    value;
    createdAt = new Date();
    updatedAt = new Date();
};
exports.SystemSetting = SystemSetting;
__decorate([
    (0, legacy_1.PrimaryKey)({ type: 'uuid' }),
    __metadata("design:type", String)
], SystemSetting.prototype, "id", void 0);
__decorate([
    (0, legacy_1.Property)({ unique: true, type: 'string' }),
    __metadata("design:type", String)
], SystemSetting.prototype, "key", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'text' }),
    __metadata("design:type", String)
], SystemSetting.prototype, "value", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime' }),
    __metadata("design:type", Date)
], SystemSetting.prototype, "createdAt", void 0);
__decorate([
    (0, legacy_1.Property)({ type: 'datetime', onUpdate: () => new Date() }),
    __metadata("design:type", Date)
], SystemSetting.prototype, "updatedAt", void 0);
exports.SystemSetting = SystemSetting = __decorate([
    (0, legacy_1.Entity)({ tableName: 'system_settings' })
], SystemSetting);
//# sourceMappingURL=system-setting.entity.js.map