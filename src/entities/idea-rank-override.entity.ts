import { OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { Idea } from './idea.entity';

@Entity({ tableName: 'idea_rank_overrides' })
export class IdeaRankOverride {
  [OptionalProps]?: 'id' | 'manualRank' | 'pinned' | 'setAt';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @OneToOne(() => Idea, (idea) => idea.rankOverride, { owner: true })
  idea!: Idea;

  @Property({ type: 'int', nullable: true })
  manualRank?: number;

  @Property({ type: 'boolean' })
  pinned: boolean = false;

  @Property({ type: 'datetime' })
  setAt: Date = new Date();
}
