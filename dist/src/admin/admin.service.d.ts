import { EntityManager } from '@mikro-orm/postgresql';
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
    getUser(userId: string): Promise<{
        id: string;
        email: string;
        role: string;
        createdAt: Date;
    }>;
    createUser(data: {
        email: string;
        passwordHash?: string;
        role?: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        createdAt: Date;
    }>;
    updateUser(userId: string, data: {
        email?: string;
        role?: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        createdAt: Date;
    }>;
    deleteUser(userId: string): Promise<{
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
                scoringMethod: import("../entities").ScoringMethod;
            }[];
            createdAt: Date;
        }[];
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
