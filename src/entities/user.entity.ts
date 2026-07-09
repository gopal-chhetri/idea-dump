import { Collection, OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  OneToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { OAuthAccount } from './oauth-account.entity';
import { RefreshToken } from './refresh-token.entity';
import { CvProfile } from './cv-profile.entity';
import { Idea } from './idea.entity';
import { UserRole } from './enums';

@Entity({ tableName: 'users' })
export class User {
  [OptionalProps]?:
    | 'id'
    | 'createdAt'
    | 'passwordHash'
    | 'role'
    | 'oauthAccounts'
    | 'refreshTokens'
    | 'cvProfile'
    | 'ideas';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property({ unique: true, type: 'string' })
  email!: string;

  @Property({ nullable: true, type: 'string' })
  passwordHash?: string;

  @Property({ type: 'text', default: UserRole.USER })
  role: UserRole = UserRole.USER;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @OneToMany(() => OAuthAccount, (account) => account.user)
  oauthAccounts = new Collection<OAuthAccount>(this);

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens = new Collection<RefreshToken>(this);

  @OneToOne(() => CvProfile, (profile) => profile.user, {
    nullable: true,
    orphanRemoval: true,
  })
  cvProfile?: CvProfile;

  @OneToMany(() => Idea, (idea) => idea.user)
  ideas = new Collection<Idea>(this);
}
