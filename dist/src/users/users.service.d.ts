import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
export declare class UsersService {
    private readonly em;
    constructor(em: EntityManager);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    resolveRole(value: string): Promise<Role>;
    create(data: {
        email: string;
        passwordHash?: string;
        role?: string;
    }): Promise<User>;
    updateRole(userId: string, role: string): Promise<User>;
}
