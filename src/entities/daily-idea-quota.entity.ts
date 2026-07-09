import {
  OptionalProps,
} from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { User } from './user.entity';

/**
 * DB backstop for the Redis-based rate limit.
 * Updated in the same transaction as idea creation.
 */
@Entity({ tableName: 'daily_idea_quotas' })
@Unique({ properties: ['user', 'date'] })
export class DailyIdeaQuota {
  [OptionalProps]?: 'id' | 'count';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User)
  user!: User;

  /** UTC date string YYYY-MM-DD */
  @Property({ type: 'date' })
  date!: string;

  @Property({ type: 'int' })
  count: number = 1;
}
