import { OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Enum,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { User } from './user.entity';
import { OAuthProvider } from './enums';

@Entity({ tableName: 'oauth_accounts' })
@Unique({ properties: ['provider', 'providerAccountId'] })
export class OAuthAccount {
  [OptionalProps]?: 'id' | 'createdAt';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Enum({ items: () => OAuthProvider })
  provider!: OAuthProvider;

  @Property({ type: 'string' })
  providerAccountId!: string;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();
}
