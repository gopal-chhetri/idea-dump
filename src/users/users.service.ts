import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    return this.em.findOne(User, { id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.em.findOne(User, { email });
  }

  async create(data: { email: string; passwordHash?: string }): Promise<User> {
    const user = this.em.create(User, {
      email: data.email,
      passwordHash: data.passwordHash,
    });
    await this.em.flush();
    return user;
  }
}
