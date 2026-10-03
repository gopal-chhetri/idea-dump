import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/enums';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id }, { populate: ['role'] });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(
      User,
      { email: email.trim().toLowerCase() },
      { populate: ['role'] },
    );
  }

  async findAll(): Promise<User[]> {
    return this.em.find(
      User,
      {},
      { orderBy: { createdAt: 'DESC' }, populate: ['role'] },
    );
  }

  async resolveRole(value: string): Promise<Role> {
    const role = await this.em.findOne(Role, { value });
    if (!role) throw new NotFoundException(`Unknown role: ${value}`);
    return role;
  }

  async create(data: {
    email: string;
    passwordHash?: string;
    role?: string;
  }): Promise<User> {
    const role = await this.resolveRole(data.role ?? UserRole.USER);
    const user = this.em.create(User, {
      email: data.email.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      role,
    });
    await this.em.flush();
    return user;
  }

  async updateRole(userId: string, role: string): Promise<User> {
    const user = await this.em.findOneOrFail(User, { id: userId });
    user.role = await this.resolveRole(role);
    await this.em.flush();
    return user;
  }
}
