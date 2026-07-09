import {
  Collection,
  OptionalProps,
} from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  OneToMany,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { User } from './user.entity';
import { CvSkill } from './cv-skill.entity';

@Entity({ tableName: 'cv_profiles' })
export class CvProfile {
  [OptionalProps]?: 'id' | 'summaryText' | 'updatedAt' | 'skills';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @OneToOne(() => User, (user) => user.cvProfile, { owner: true })
  user!: User;

  @Property({ type: 'text', default: '' })
  summaryText: string = '';

  @Property({ onUpdate: () => new Date(), type: 'datetime' })
  updatedAt: Date = new Date();

  @OneToMany(() => CvSkill, (skill) => skill.cvProfile, {
    orphanRemoval: true,
  })
  skills = new Collection<CvSkill>(this);
}
