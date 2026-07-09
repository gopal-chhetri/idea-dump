import { OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { User } from './user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken {
  [OptionalProps]?: 'id' | 'revokedAt' | 'createdAt';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User)
  user!: User;

  @Property({ type: 'string' })
  tokenHash!: string;

  @Property({ type: 'datetime' })
  expiresAt!: Date;

  @Property({ nullable: true, type: 'datetime' })
  revokedAt?: Date;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();
}
