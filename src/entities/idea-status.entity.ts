import { Collection, OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { Idea } from './idea.entity';

@Entity({ tableName: 'idea_status' })
export class IdeaStatus {
  [OptionalProps]?:
    'id' | 'label' | 'sortOrder' | 'isDefault' | 'createdAt' | 'ideas';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property({ unique: true, type: 'string' })
  value!: string;

  @Property({ nullable: true, type: 'string' })
  label?: string;

  @Property({ type: 'int', default: 0 })
  sortOrder: number = 0;

  @Property({ type: 'boolean', default: false })
  isDefault: boolean = false;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();

  @OneToMany(() => Idea, (idea) => idea.status)
  ideas = new Collection<Idea>(this);
}
