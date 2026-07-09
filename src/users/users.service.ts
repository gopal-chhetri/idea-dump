import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/enums';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  async findAll(): Promise<User[]> {
    return this.em.find(User, {}, { orderBy: { createdAt: 'DESC' } });
  }

  async create(data: {
    email: string;
    passwordHash?: string;
    role?: UserRole;
  }): Promise<User> {
    const user = this.em.create(User, {
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? UserRole.USER,
    });
    await this.em.flush();
    return user;
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.em.findOneOrFail(User, { id: userId });
    user.role = role;
    await this.em.flush();
    return user;
  }
}
