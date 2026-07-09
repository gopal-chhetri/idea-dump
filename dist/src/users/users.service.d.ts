import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/enums';
export declare class UsersService {
    private readonly em;
    constructor(em: EntityManager);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    create(data: {
        email: string;
        passwordHash?: string;
        role?: UserRole;
    }): Promise<User>;
    updateRole(userId: string, role: UserRole): Promise<User>;
}
