import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { User } from '../entities/user.entity';
import { IdeaStatus } from '../entities/idea-status.entity';
import { DailyIdeaQuota } from '../entities/daily-idea-quota.entity';

const DEFAULT_STATUS = 'draft';

@Injectable()
export class IdeasService {
  constructor(private readonly em: EntityManager) {}

  private async resolveStatus(value: string): Promise<IdeaStatus> {
    const status = await this.em.findOne(IdeaStatus, { value });
    if (!status) {
      throw new NotFoundException(`Unknown idea status: ${value}`);
    }
    return status;
  }

  async create(
    userId: string,
    data: {
      title: string;
      description: string;
      features?: string[];
      useCase: string;
      status?: string;
    },
  ): Promise<Idea> {
    const user = await this.em.findOneOrFail(User, { id: userId });
    const status = data.status
      ? await this.resolveStatus(data.status)
      : (await this.em.findOne(IdeaStatus, { isDefault: true })) ??
        (await this.resolveStatus(DEFAULT_STATUS));

    const idea = this.em.create(Idea, {
      user,
      title: data.title,
      description: data.description,
      features: data.features ?? [],
      useCase: data.useCase,
      status,
    });
    this.em.persist(idea);

    // DB quota backstop - update in same transaction
    await this.updateQuota(userId);

    await this.em.flush();
    return idea;
  }

  async findAllByUser(userId: string): Promise<Idea[]> {
    return this.em.find(
      Idea,
      { user: userId },
      {
        populate: ['scores', 'rankOverride', 'status'],
        orderBy: { createdAt: 'DESC' },
      },
    );
  }

  async findOne(userId: string, ideaId: string): Promise<Idea> {
    const idea = await this.em.findOne(
      Idea,
      { id: ideaId },
      { populate: ['scores', 'rankOverride', 'status'] },
    );

    if (!idea) throw new NotFoundException('Idea not found');
    this.assertOwnership(idea, userId);
    return idea;
  }

  async update(
    userId: string,
    ideaId: string,
    data: Partial<{
      title: string;
      description: string;
      features: string[];
      useCase: string;
      status: string;
    }>,
  ): Promise<Idea> {
    const idea = await this.findOne(userId, ideaId);

    if (data.title !== undefined) idea.title = data.title;
    if (data.description !== undefined) idea.description = data.description;
    if (data.features !== undefined) idea.features = data.features;
    if (data.useCase !== undefined) idea.useCase = data.useCase;
    if (data.status !== undefined)
      idea.status = await this.resolveStatus(data.status);

    await this.em.flush();
    return idea;
  }

  async remove(userId: string, ideaId: string): Promise<void> {
    const idea = await this.findOne(userId, ideaId);
    this.em.remove(idea);
    await this.em.flush();
  }

  // ── Helpers ─────────────────────────────────────────────

  private assertOwnership(idea: Idea, userId: string): void {
    const ideaUserId = typeof idea.user === 'string' ? idea.user : idea.user.id;
    if (ideaUserId !== userId) {
      throw new ForbiddenException('Not your idea');
    }
  }

  private async updateQuota(userId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await this.em.findOne(DailyIdeaQuota, {
      user: userId,
      date: today,
    });

    if (existing) {
      existing.count += 1;
    } else {
      const user = await this.em.findOneOrFail(User, { id: userId });
      const quota = this.em.create(DailyIdeaQuota, {
        user,
        date: today,
        count: 1,
      });
      this.em.persist(quota);
    }
  }
}
