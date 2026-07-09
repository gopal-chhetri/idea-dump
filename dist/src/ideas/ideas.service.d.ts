import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { IdeaStatus } from '../entities/enums';
export declare class IdeasService {
    private readonly em;
    constructor(em: EntityManager);
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
        status: IdeaStatus;
    }>): Promise<Idea>;
    remove(userId: string, ideaId: string): Promise<void>;
    private assertOwnership;
    private updateQuota;
}
