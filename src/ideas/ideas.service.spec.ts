import { ForbiddenException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { IdeasService } from './ideas.service';
import { DailyQuotaService } from '../rate-limit/daily-quota.service';
import { Idea } from '../entities/idea.entity';

describe('IdeasService', () => {
  const idea = { id: 'i1', user: { id: 'owner' } } as Idea;

  function service(
    em: Partial<EntityManager>,
    quota?: Partial<DailyQuotaService>,
  ) {
    return new IdeasService(
      em as EntityManager,
      (quota ?? {}) as DailyQuotaService,
    );
  }

  it('returns an idea to its owner', async () => {
    const svc = service({ findOne: jest.fn().mockResolvedValue(idea) });
    await expect(svc.findOne('owner', 'i1')).resolves.toBe(idea);
  });

  it('forbids access to another user', async () => {
    const svc = service({ findOne: jest.fn().mockResolvedValue(idea) });
    await expect(svc.findOne('intruder', 'i1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('releases the quota reservation when creation fails', async () => {
    const release = jest.fn().mockResolvedValue(undefined);
    const svc = service(
      { findOneOrFail: jest.fn().mockRejectedValue(new Error('db down')) },
      { reserve: jest.fn().mockResolvedValue(release) },
    );
    await expect(
      svc.create('owner', { title: 't', description: 'd', useCase: 'u' }),
    ).rejects.toThrow('db down');
    expect(release).toHaveBeenCalled();
  });
});
