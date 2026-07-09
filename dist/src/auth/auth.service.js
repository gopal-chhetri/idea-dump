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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const postgresql_1 = require("@mikro-orm/postgresql");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
const entities_1 = require("../entities");
const SALT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 7;
let AuthService = class AuthService {
    usersService;
    jwtService;
    em;
    constructor(usersService, jwtService, em) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.em = em;
    }
    async register(email, password) {
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await this.usersService.create({ email, passwordHash });
        return this.issueTokens(user);
    }
    async validateLocalUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user?.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    async login(user) {
        return this.issueTokens(user);
    }
    async validateOAuthUser(provider, providerAccountId, email) {
        const existingOAuth = await this.em.findOne(entities_1.OAuthAccount, {
            provider,
            providerAccountId,
        });
        if (existingOAuth) {
            const user = await this.usersService.findById(typeof existingOAuth.user === 'string'
                ? existingOAuth.user
                : existingOAuth.user.id);
            return user;
        }
        let user = await this.usersService.findByEmail(email);
        if (!user) {
            user = await this.usersService.create({ email });
        }
        const oauthAccount = this.em.create(entities_1.OAuthAccount, {
            user,
            provider,
            providerAccountId,
        });
        this.em.persist(oauthAccount);
        await this.em.flush();
        return user;
    }
    async refresh(rawRefreshToken) {
        const tokenHash = this.hashToken(rawRefreshToken);
        const stored = await this.em.findOne(refresh_token_entity_1.RefreshToken, { tokenHash });
        if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
            if (stored) {
                await this.revokeAllUserTokens(typeof stored.user === 'string' ? stored.user : stored.user.id);
            }
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        stored.revokedAt = new Date();
        const userId = typeof stored.user === 'string' ? stored.user : stored.user.id;
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        await this.em.flush();
        return this.issueTokens(user);
    }
    async issueTokens(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload);
        const rawRefreshToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(rawRefreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
        const refreshTokenEntity = this.em.create(refresh_token_entity_1.RefreshToken, {
            user,
            tokenHash,
            expiresAt,
        });
        this.em.persist(refreshTokenEntity);
        await this.em.flush();
        return {
            accessToken,
            refreshToken: rawRefreshToken,
            expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        };
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async revokeAllUserTokens(userId) {
        const tokens = await this.em.find(refresh_token_entity_1.RefreshToken, {
            user: userId,
            revokedAt: null,
        });
        tokens.forEach((t) => (t.revokedAt = new Date()));
        await this.em.flush();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        postgresql_1.EntityManager])
], AuthService);
//# sourceMappingURL=auth.service.js.map