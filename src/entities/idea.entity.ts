import { Collection, OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  OneToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { User } from './user.entity';
import { IdeaStatus } from './idea-status.entity';
import { IdeaScore } from './idea-score.entity';
import { IdeaRankOverride } from './idea-rank-override.entity';

@Entity({ tableName: 'ideas' })
export class Idea {
  [OptionalProps]?: 'id' | 'features' | 'createdAt' | 'scores' | 'rankOverride';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => User)
  user!: User;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'json' })
  features: string[] = [];

  @Property({ type: 'text' })
  useCase!: string;

  @ManyToOne(() => IdeaStatus)
  status!: IdeaStatus;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @OneToMany(() => IdeaScore, (score) => score.idea, { orphanRemoval: true })
  scores = new Collection<IdeaScore>(this);

  @OneToOne(() => IdeaRankOverride, (override) => override.idea, {
    nullable: true,
    orphanRemoval: true,
  })
  rankOverride?: IdeaRankOverride;
}
