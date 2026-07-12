import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        userCount: number;
        adminCount: number;
        ideaCount: number;
    }>;
    listUsers(page?: number, limit?: number): Promise<{
        users: {
            id: string;
            email: string;
            role: string;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createUser(body: {
        email: string;
        passwordHash?: string;
        role?: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        createdAt: Date;
    }>;
    getUser(id: string): Promise<{
        id: string;
        email: string;
        role: string;
        createdAt: Date;
    }>;
    updateUser(id: string, body: {
        email?: string;
        role?: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        createdAt: Date;
    }>;
    deleteUser(id: string): Promise<{
        deleted: boolean;
    }>;
    listIdeas(page?: number, limit?: number): Promise<{
        ideas: {
            id: string;
            title: string;
            status: string;
            user: {
                id: string;
                email: string;
            } | null;
            scores: {
                finalScore: number;
                fitScore: number;
                effortScore: number;
                noveltyScore: number;
                scoringMethod: import("../entities/enums").ScoringMethod;
            }[];
            createdAt: Date;
        }[];
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
