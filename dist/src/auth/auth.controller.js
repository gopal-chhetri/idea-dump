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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const refresh_dto_1 = require("./dto/refresh.dto");
const local_auth_guard_1 = require("./guards/local-auth.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        return this.authService.register(dto.email, dto.password);
    }
    async login(req) {
        return this.authService.login(req.user);
    }
    async refresh(dto) {
        return this.authService.refresh(dto.refreshToken);
    }
    googleLogin() {
    }
    async googleCallback(req, res) {
        const tokens = await this.authService.login(req.user);
        const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000/app';
        const params = new URLSearchParams({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
        res.redirect(`${frontendOrigin}?${params.toString()}`);
    }
    githubLogin() {
    }
    async githubCallback(req, res) {
        const tokens = await this.authService.login(req.user);
        const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000/app';
        const params = new URLSearchParams({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
        res.redirect(`${frontendOrigin}?${params.toString()}`);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register a new local account',
        description: 'Creates a user and returns an access + refresh token pair.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Account created. Returns access + refresh tokens.',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({
        summary: 'Log in with email + password',
        description: 'Validates credentials via Passport LocalStrategy and issues tokens.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            example: { email: 'user@gmail.com', password: 'password123' },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful. Returns access + refresh tokens.',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiOperation)({
        summary: 'Rotate refresh token',
        description: 'Exchanges an opaque refresh token for a new access + refresh token pair. Previous token is revoked.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'New token pair issued.' }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid or expired refresh token.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_dto_1.RefreshDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, common_1.Get)('google'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate Google OAuth flow',
        description: 'Redirects the browser to the Google consent screen.',
    }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirects to Google.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    (0, common_1.Get)('google/callback'),
    (0, swagger_1.ApiOperation)({
        summary: 'Google OAuth callback',
        description: 'Handles the Google OAuth redirect and issues tokens. Redirects to FRONTEND_URL with tokens in query string.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 302,
        description: 'Redirects to frontend with accessToken and refreshToken query params.',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('github')),
    (0, common_1.Get)('github'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate GitHub OAuth flow',
        description: 'Redirects the browser to the GitHub authorization page.',
    }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirects to GitHub.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "githubLogin", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('github')),
    (0, common_1.Get)('github/callback'),
    (0, swagger_1.ApiOperation)({
        summary: 'GitHub OAuth callback',
        description: 'Handles the GitHub OAuth redirect and issues tokens. Redirects to FRONTEND_URL with tokens in query string.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 302,
        description: 'Redirects to frontend with accessToken and refreshToken query params.',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "githubCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map