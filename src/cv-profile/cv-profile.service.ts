import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CvProfile } from '../entities/cv-profile.entity';
import { CvSkill } from '../entities/cv-skill.entity';
import { User } from '../entities/user.entity';
import { SkillCategory } from '../entities/enums';
import { matchSkills, extractSummary } from './skill-dictionary';

interface PdfTextParser {
  load(): Promise<void>;
  getText(): Promise<{ text?: string }>;
}

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

  async uploadAndExtract(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<{ summaryText: string; skillsAdded: number }> {
    let text: string;
    const lowerName = fileName.toLowerCase();
    const isPdf = mimeType === 'application/pdf' && lowerName.endsWith('.pdf');
    const isText = mimeType === 'text/plain' && lowerName.endsWith('.txt');

    if (isPdf) {
      const { PDFParse } = await import('pdf-parse');
      // load() is private in the typings but needed before getText().
      const parser = new PDFParse(
        new Uint8Array(buffer),
      ) as unknown as PdfTextParser;
      await parser.load();
      const result = await parser.getText();
      text = result.text ?? '';
    } else if (isText) {
      text = buffer.toString('utf-8');
    } else {
      throw new BadRequestException(
        'Unsupported file type. Please upload a PDF or TXT file.',
      );
    }

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('File appears to be empty or unreadable.');
    }

    const summaryText = extractSummary(text);
    const matchedSkills = matchSkills(text);

    let profile = await this.em.findOne(CvProfile, { user: userId });
    if (!profile) {
      const user = await this.em.findOneOrFail(User, { id: userId });
      profile = this.em.create(CvProfile, { user, summaryText });
      this.em.persist(profile);
    } else {
      profile.summaryText = summaryText;
    }

    const existingSkills = await this.em.find(CvSkill, {
      cvProfile: profile,
    });
    const existingNames = new Set(
      existingSkills.map((s) => s.name.toLowerCase()),
    );

    let skillsAdded = 0;
    for (const entry of matchedSkills) {
      if (!existingNames.has(entry.name.toLowerCase())) {
        const skill = this.em.create(CvSkill, {
          cvProfile: profile,
          name: entry.name,
          category: entry.category as SkillCategory,
          weight: 3,
        });
        this.em.persist(skill);
        skillsAdded++;
      }
    }

    await this.em.flush();
    return { summaryText, skillsAdded };
  }
}
