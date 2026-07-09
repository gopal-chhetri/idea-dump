import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { Idea } from '../entities/idea.entity';
import { UserRole } from '../entities/enums';
import { ScoringService } from '../scoring/scoring.service';
export declare class AdminService {
    private readonly em;
    private readonly scoringService;
    constructor(em: EntityManager, scoringService: ScoringService);
    getStats(): Promise<{
        userCount: number;
        adminCount: number;
        ideaCount: number;
    }>;
    listUsers(page?: number, limit?: number): Promise<{
        users: import("@mikro-orm/postgresql", { with: { "resolution-mode": "import" } }).Loaded<User, never, never, never>[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUser(userId: string): Promise<import("@mikro-orm/postgresql", { with: { "resolution-mode": "import" } }).Loaded<User, never, never, never>>;
    createUser(data: {
        email: string;
        passwordHash?: string;
        role?: UserRole;
    }): Promise<User>;
    updateUser(userId: string, data: {
        email?: string;
        role?: UserRole;
    }): Promise<import("@mikro-orm/postgresql", { with: { "resolution-mode": "import" } }).Loaded<User, never, never, never>>;
    deleteUser(userId: string): Promise<{
        deleted: boolean;
    }>;
    listIdeas(page?: number, limit?: number): Promise<{
        ideas: import("@mikro-orm/postgresql", { with: { "resolution-mode": "import" } }).Loaded<Idea, "user" | "scores" | "rankOverride", never, never>[];
        total: number;
        page: number;
        limit: number;
    }>;
    deleteIdea(ideaId: string): Promise<{
        deleted: boolean;
    }>;
    rescoreIdea(ideaId: string): Promise<import("../entities").IdeaScore>;
    rescoreAll(): Promise<{
        rescored: number;
    }>;
    listSettings(): Promise<{
        key: string;
        value: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    upsertSetting(key: string, value: string): Promise<{
        key: string;
        updatedAt: Date;
    }>;
    private encrypt;
    private decrypt;
}
