"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const crypto = __importStar(require("node:crypto"));
const user_entity_1 = require("../entities/user.entity");
const idea_entity_1 = require("../entities/idea.entity");
const system_setting_entity_1 = require("../entities/system-setting.entity");
const enums_1 = require("../entities/enums");
const scoring_service_1 = require("../scoring/scoring.service");
const ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY || 'insecure-dev-key-32-chars-long!!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
function deriveKey(raw) {
    return crypto.scryptSync(raw, 'idea-dump-salt', 32);
}
let AdminService = class AdminService {
    em;
    scoringService;
    constructor(em, scoringService) {
        this.em = em;
        this.scoringService = scoringService;
    }
    async getStats() {
        const userCount = await this.em.count(user_entity_1.User, {});
        const ideaCount = await this.em.count(idea_entity_1.Idea, {});
        const adminCount = await this.em.count(user_entity_1.User, { role: enums_1.UserRole.ADMIN });
        return { userCount, adminCount, ideaCount };
    }
    async listUsers(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [users, total] = await this.em.findAndCount(user_entity_1.User, {}, {
            orderBy: { createdAt: 'DESC' },
            limit,
            offset,
        });
        return { users, total, page, limit };
    }
    async getUser(userId) {
        const user = await this.em.findOne(user_entity_1.User, { id: userId });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async createUser(data) {
        const existing = await this.em.findOne(user_entity_1.User, { email: data.email });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const user = this.em.create(user_entity_1.User, {
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role ?? enums_1.UserRole.USER,
        });
        this.em.persist(user);
        await this.em.flush();
        return user;
    }
    async updateUser(userId, data) {
        const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
        if (data.email !== undefined)
            user.email = data.email;
        if (data.role !== undefined)
            user.role = data.role;
        await this.em.flush();
        return user;
    }
    async deleteUser(userId) {
        const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
        this.em.remove(user);
        await this.em.flush();
        return { deleted: true };
    }
    async listIdeas(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [ideas, total] = await this.em.findAndCount(idea_entity_1.Idea, {}, {
            populate: ['scores', 'rankOverride', 'user'],
            orderBy: { createdAt: 'DESC' },
            limit,
            offset,
        });
        return { ideas, total, page, limit };
    }
    async deleteIdea(ideaId) {
        const idea = await this.em.findOneOrFail(idea_entity_1.Idea, { id: ideaId });
        this.em.remove(idea);
        await this.em.flush();
        return { deleted: true };
    }
    async rescoreIdea(ideaId) {
        const idea = await this.em.findOneOrFail(idea_entity_1.Idea, { id: ideaId });
        const userId = typeof idea.user === 'string' ? idea.user : idea.user.id;
        return this.scoringService.scoreIdea(ideaId, userId);
    }
    async rescoreAll() {
        const ideas = await this.em.find(idea_entity_1.Idea, {}, { fields: ['id', 'user'] });
        for (const idea of ideas) {
            const userId = typeof idea.user === 'string' ? idea.user : idea.user.id;
            await this.scoringService.scoreIdea(idea.id, userId);
        }
        return { rescored: ideas.length };
    }
    async listSettings() {
        const settings = await this.em.find(system_setting_entity_1.SystemSetting, {});
        return settings.map((s) => ({
            key: s.key,
            value: this.decrypt(s.value),
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        }));
    }
    async upsertSetting(key, value) {
        const encrypted = this.encrypt(value);
        let setting = await this.em.findOne(system_setting_entity_1.SystemSetting, { key });
        if (setting) {
            setting.value = encrypted;
            setting.updatedAt = new Date();
        }
        else {
            setting = this.em.create(system_setting_entity_1.SystemSetting, { key, value: encrypted });
            this.em.persist(setting);
        }
        await this.em.flush();
        return { key, updatedAt: setting.updatedAt };
    }
    encrypt(plaintext) {
        const key = deriveKey(ENCRYPTION_KEY);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }
    decrypt(ciphertext) {
        const key = deriveKey(ENCRYPTION_KEY);
        const parts = ciphertext.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.EntityManager,
        scoring_service_1.ScoringService])
], AdminService);
//# sourceMappingURL=admin.service.js.map