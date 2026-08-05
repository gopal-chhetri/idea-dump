import { OptionalProps } from '@mikro-orm/core';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Enum,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { CvProfile } from './cv-profile.entity';
import { SkillCategory } from './enums';

@Entity({ tableName: 'cv_skills' })
export class CvSkill {
  [OptionalProps]?: 'id' | 'weight';
  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @ManyToOne(() => CvProfile)
  cvProfile!: CvProfile;

  @Property({ type: 'string' })
  name!: string;

  @Enum({ items: () => SkillCategory })
  category!: SkillCategory;

  /** 1-5, higher = more proficient / relevant */
  @Property({ type: 'smallint' })
  weight: number = 3;
}
