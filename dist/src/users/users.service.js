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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const postgresql_1 = require("@mikro-orm/postgresql");
const user_entity_1 = require("../entities/user.entity");
const role_entity_1 = require("../entities/role.entity");
const enums_1 = require("../entities/enums");
let UsersService = class UsersService {
    em;
    constructor(em) {
        this.em = em;
    }
    async findById(id) {
        return this.em.findOne(user_entity_1.User, { id }, { populate: ['role'] });
    }
    async findByEmail(email) {
        return this.em.findOne(user_entity_1.User, { email }, { populate: ['role'] });
    }
    async findAll() {
        return this.em.find(user_entity_1.User, {}, { orderBy: { createdAt: 'DESC' }, populate: ['role'] });
    }
    async resolveRole(value) {
        const role = await this.em.findOne(role_entity_1.Role, { value });
        if (!role)
            throw new common_1.NotFoundException(`Unknown role: ${value}`);
        return role;
    }
    async create(data) {
        const role = await this.resolveRole(data.role ?? enums_1.UserRole.USER);
        const user = this.em.create(user_entity_1.User, {
            email: data.email,
            passwordHash: data.passwordHash,
            role,
        });
        await this.em.flush();
        return user;
    }
    async updateRole(userId, role) {
        const user = await this.em.findOneOrFail(user_entity_1.User, { id: userId });
        user.role = await this.resolveRole(role);
        await this.em.flush();
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.EntityManager])
], UsersService);
//# sourceMappingURL=users.service.js.map