import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
export declare class IdeasService {
    private readonly em;
    constructor(em: EntityManager);
    private resolveStatus;
    create(userId: string, data: {
        title: string;
        description: string;
        features?: string[];
        useCase: string;
    }): Promise<Idea>;
    findAllByUser(userId: string): Promise<Idea[]>;
    findOne(userId: string, ideaId: string): Promise<Idea>;
    update(userId: string, ideaId: string, data: Partial<{
        title: string;
        description: string;
        features: string[];
        useCase: string;
        status: string;
    }>): Promise<Idea>;
    remove(userId: string, ideaId: string): Promise<void>;
    private assertOwnership;
    private updateQuota;
}
