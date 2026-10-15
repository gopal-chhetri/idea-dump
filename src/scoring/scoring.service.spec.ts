import { EntityManager } from '@mikro-orm/postgresql';
import { ScoringService } from './scoring.service';
import { RuleBasedScoringStrategy } from './strategies/rule-based-scoring.strategy';
import { JevScoringStrategy } from './strategies/jev-scoring.strategy';
import { Idea } from '../entities/idea.entity';
import { CvProfile } from '../entities/cv-profile.entity';
import { IdeaScore } from '../entities/idea-score.entity';
import { ScoringMethod } from '../entities/enums';

const idea = {
  id: 'i1',
  title: 'Habit tracker',
  description: 'Track habits',
  features: [],
  useCase: 'Me',
} as unknown as Idea;

/** Records persisted scores; finds return the fixed idea and profile. */
function fakeEm() {
  const persisted: IdeaScore[] = [];
  const em = {
    findOne: jest.fn((entity: unknown) => {
      if (entity === Idea) return idea;
      if (entity === CvProfile)
        return { summaryText: 'Engineer', skills: { getItems: () => [] } };
      return null; // no existing IdeaScore rows
    }),
    find: jest.fn(() => [idea]),
    create: jest.fn((_entity: unknown, data: Partial<IdeaScore>) => ({
      ...data,
    })),
    persist: jest.fn((score: IdeaScore) => persisted.push(score)),
    flush: jest.fn(),
  } as unknown as EntityManager;
  return { em, persisted };
}

function jevStrategy(enabled: boolean, score: jest.Mock) {
  return { enabled, score } as unknown as JevScoringStrategy;
}

describe('ScoringService', () => {
  it('scores rule-based only when Jev is not configured', async () => {
    const { em, persisted } = fakeEm();
    const jevScore = jest.fn();
    const service = new ScoringService(
      em,
      new RuleBasedScoringStrategy(),
      jevStrategy(false, jevScore),
    );

    const result = await service.scoreIdea('i1', 'u1');

    expect(jevScore).not.toHaveBeenCalled();
    expect(persisted.map((s) => s.scoringMethod)).toEqual([
      ScoringMethod.RULE_BASED,
    ]);
    expect(result.scoringMethod).toBe(ScoringMethod.RULE_BASED);
  });

  it('saves a Jev score with its confidence and ranks by it', async () => {
    const { em, persisted } = fakeEm();
    const jevScore = jest.fn().mockResolvedValue({
      fitScore: 80,
      effortScore: 20,
      noveltyScore: 60,
      confidence: 0.9,
    });
    const service = new ScoringService(
      em,
      new RuleBasedScoringStrategy(),
      jevStrategy(true, jevScore),
    );

    const result = await service.scoreIdea('i1', 'u1');

    expect(jevScore).toHaveBeenCalledWith(idea, [], [idea], 'Engineer');
    const jev = persisted.find((s) => s.scoringMethod === ScoringMethod.LLM);
    expect(jev?.confidence).toBe(0.9);
    expect(jev?.finalScore).toBeCloseTo(0.5 * 80 + 0.3 * 80 + 0.2 * 60);
    expect(result).toBe(jev);
  });

  it('keeps the rule-based score when Jev fails', async () => {
    const { em, persisted } = fakeEm();
    const service = new ScoringService(
      em,
      new RuleBasedScoringStrategy(),
      jevStrategy(true, jest.fn().mockRejectedValue(new Error('rate limited'))),
    );

    const result = await service.scoreIdea('i1', 'u1');

    expect(persisted.map((s) => s.scoringMethod)).toEqual([
      ScoringMethod.RULE_BASED,
    ]);
    expect(result.scoringMethod).toBe(ScoringMethod.RULE_BASED);
  });
});
