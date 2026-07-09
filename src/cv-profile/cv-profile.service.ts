import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CvProfile } from '../entities/cv-profile.entity';
import { CvSkill } from '../entities/cv-skill.entity';
import { User } from '../entities/user.entity';
import { SkillCategory } from '../entities/enums';

@Injectable()
export class CvProfileService {
  constructor(private readonly em: EntityManager) {}

  async getProfile(userId: string): Promise<CvProfile | null> {
    return this.em.findOne(
      CvProfile,
      { user: userId },
      { populate: ['skills'] },
    );
  }

  async upsertProfile(userId: string, summaryText: string): Promise<CvProfile> {
    let profile = await this.em.findOne(CvProfile, { user: userId });

    if (profile) {
      profile.summaryText = summaryText;
    } else {
      const user = await this.em.findOneOrFail(User, { id: userId });
      profile = this.em.create(CvProfile, { user, summaryText });
      this.em.persist(profile);
    }

    await this.em.flush();
    return this.em.findOneOrFail(
      CvProfile,
      { id: profile.id },
      { populate: ['skills'] },
    );
  }

  async addSkill(
    userId: string,
    name: string,
    category: SkillCategory,
    weight?: number,
  ): Promise<CvSkill> {
    let profile = await this.em.findOne(CvProfile, { user: userId });

    if (!profile) {
      // Auto-create empty profile
      const user = await this.em.findOneOrFail(User, { id: userId });
      profile = this.em.create(CvProfile, { user, summaryText: '' });
      this.em.persist(profile);
      await this.em.flush();
    }

    const skill = this.em.create(CvSkill, {
      cvProfile: profile,
      name,
      category,
      ...(weight !== undefined ? { weight } : {}),
    });
    this.em.persist(skill);
    await this.em.flush();
    return skill;
  }

  async removeSkill(userId: string, skillId: string): Promise<void> {
    const skill = await this.em.findOne(
      CvSkill,
      { id: skillId },
      { populate: ['cvProfile'] },
    );

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Verify ownership via profile → user
    const profile = await this.em.findOneOrFail(
      CvProfile,
      { id: skill.cvProfile.id },
      { populate: ['user'] },
    );

    if (profile.user.id !== userId) {
      throw new ForbiddenException('Not your skill');
    }

    this.em.remove(skill);
    await this.em.flush();
  }
}
