import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Idea } from '../entities/idea.entity';
import { User } from '../entities/user.entity';
import { IdeaStatus } from '../entities/idea-status.entity';
import { DailyQuotaService } from '../rate-limit/daily-quota.service';

const DEFAULT_STATUS = 'draft';

@Injectable()
export class IdeasService {
  private readonly logger = new Logger(IdeasService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly quota: DailyQuotaService,
  ) {}

  private async resolveStatus(value: string): Promise<IdeaStatus> {
    const status = await this.em.findOne(IdeaStatus, { value });
    if (!status) {
      throw new BadRequestException(`Unknown idea status: ${value}`);
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
    // Reserved here rather than in a guard: guards run before validation,
    // so a rejected request would otherwise still use up the quota.
    const release = await this.quota.reserve(userId);
    let idea: Idea;
    try {
      const user = await this.em.findOneOrFail(User, { id: userId });
      const status = data.status
        ? await this.resolveStatus(data.status)
        : ((await this.em.findOne(IdeaStatus, { isDefault: true })) ??
          (await this.resolveStatus(DEFAULT_STATUS)));

      idea = this.em.create(Idea, {
        user,
        title: data.title,
        description: data.description,
        features: data.features ?? [],
        useCase: data.useCase,
        status,
      });
      await this.em.persist(idea).flush();
    } catch (err) {
      await release();
      throw err;
    }

    // The idea exists now; a failed backstop write must not undo or fail it.
    await this.quota
      .recordInDb(userId)
      .catch((err: unknown) =>
        this.logger.warn(`Failed to record DB quota: ${String(err)}`),
      );
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
    const ideaUserId = idea.user.id;
    if (ideaUserId !== userId) {
      throw new ForbiddenException('Not your idea');
    }
  }
}
