import {
  OptionalProps,
} from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { Idea } from './idea.entity';
import { ScoringMethod } from './enums';

@Entity({ tableName: 'idea_scores' })
export class IdeaScore {
  [OptionalProps]?: 'id' | 'scoredAt';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => Idea)
  idea!: Idea;

  @Property({ type: 'float' })
  fitScore!: number;

  @Property({ type: 'float' })
  effortScore!: number;

  @Property({ type: 'float' })
  noveltyScore!: number;

  @Property({ type: 'float' })
  finalScore!: number;

  @Enum({ items: () => ScoringMethod })
  scoringMethod!: ScoringMethod;

  @Property({ type: 'datetime' })
  scoredAt: Date = new Date();
}
