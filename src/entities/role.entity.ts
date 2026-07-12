import { Collection, OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { User } from './user.entity';

@Entity({ tableName: 'roles' })
export class Role {
  [OptionalProps]?: 'id' | 'name' | 'isDefault' | 'createdAt' | 'users';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property({ unique: true, type: 'string' })
  value!: string;

  @Property({ nullable: true, type: 'string' })
  name?: string;

  @Property({ type: 'boolean', default: false })
  isDefault: boolean = false;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @OneToMany(() => User, (user) => user.role)
  users = new Collection<User>(this);
}
