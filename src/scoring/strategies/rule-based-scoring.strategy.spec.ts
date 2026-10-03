import { RuleBasedScoringStrategy } from './rule-based-scoring.strategy';
import { Idea } from '../../entities/idea.entity';
import { CvSkill } from '../../entities/cv-skill.entity';

const idea = (over: Partial<Idea> = {}): Idea =>
  ({
    id: 'i1',
    title: 'Code review bot',
    description: 'Reviews pull requests with typescript tooling',
    features: [],
    useCase: 'Teams',
    ...over,
  }) as Idea;

const skill = (name: string, weight = 3): CvSkill =>
  ({ name, weight }) as CvSkill;

describe('RuleBasedScoringStrategy', () => {
  const strategy = new RuleBasedScoringStrategy();

  it('gives a neutral fit score without skills', async () => {
    const r = await strategy.score(idea(), [], []);
    expect(r.fitScore).toBe(50);
  });

  it('weights fit by matching skills', async () => {
    const r = await strategy.score(
      idea(),
      [skill('TypeScript', 3), skill('Rust', 1)],
      [],
    );
    expect(r.fitScore).toBe(75); // 3 of 4 weight matched
  });

  it('lowers the effort score as features and description grow', async () => {
    const small = await strategy.score(idea(), [], []);
    const big = await strategy.score(
      idea({
        features: Array.from({ length: 8 }, (_, i) => `f${i}`),
        description: 'x'.repeat(3000),
      }),
      [],
      [],
    );
    expect(small.effortScore).toBeGreaterThan(big.effortScore);
    expect(big.effortScore).toBe(0);
  });

  it('treats the first idea as fully novel and duplicates as not novel', async () => {
    const first = await strategy.score(idea(), [], [idea()]);
    expect(first.noveltyScore).toBe(100);

    const dup = await strategy.score(idea(), [], [idea(), idea({ id: 'i2' })]);
    expect(dup.noveltyScore).toBe(0);
  });
});
