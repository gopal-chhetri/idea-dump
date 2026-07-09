import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
export declare class UsersService {
    private readonly em;
    constructor(em: EntityManager);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: {
        email: string;
        passwordHash?: string;
    }): Promise<User>;
}
