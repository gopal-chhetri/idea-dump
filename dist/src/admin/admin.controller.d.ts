import { AdminService } from './admin.service';
import { UserRole } from '../entities/enums';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        userCount: number;
        adminCount: number;
        ideaCount: number;
    }>;
    listUsers(page?: number, limit?: number): Promise<{
        users: import("@mikro-orm/core", { with: { "resolution-mode": "import" } }).Loaded<import("../entities").User, never, never, never>[];
        total: number;
        page: number;
        limit: number;
    }>;
    createUser(body: {
        email: string;
        passwordHash?: string;
        role?: UserRole;
    }): Promise<import("../entities").User>;
    getUser(id: string): Promise<import("@mikro-orm/core", { with: { "resolution-mode": "import" } }).Loaded<import("../entities").User, never, never, never>>;
    updateUser(id: string, body: {
        email?: string;
        role?: UserRole;
    }): Promise<import("@mikro-orm/core", { with: { "resolution-mode": "import" } }).Loaded<import("../entities").User, never, never, never>>;
    deleteUser(id: string): Promise<{
        deleted: boolean;
    }>;
    listIdeas(page?: number, limit?: number): Promise<{
        ideas: import("@mikro-orm/core", { with: { "resolution-mode": "import" } }).Loaded<import("../entities").Idea, "user" | "scores" | "rankOverride", never, never>[];
        total: number;
        page: number;
        limit: number;
    }>;
    deleteIdea(id: string): Promise<{
        deleted: boolean;
    }>;
    rescoreIdea(id: string): Promise<import("../entities").IdeaScore>;
    rescoreAll(): Promise<{
        rescored: number;
    }>;
    listSettings(): Promise<{
        key: string;
        value: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    upsertSetting(body: {
        key: string;
        value: string;
    }): Promise<{
        key: string;
        updatedAt: Date;
    }>;
}
