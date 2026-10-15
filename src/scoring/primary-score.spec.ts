import { orderScores, primaryScore } from './primary-score';
import { ScoringMethod } from '../entities/enums';

const rule = { scoringMethod: ScoringMethod.RULE_BASED, confidence: undefined };
const jev = (confidence: number) => ({
  scoringMethod: ScoringMethod.LLM,
  confidence,
});

describe('primaryScore', () => {
  it('prefers a confident Jev score', () => {
    const confident = jev(0.8);
    expect(primaryScore([rule, confident], 0.5)).toBe(confident);
  });

  it('falls back to rule-based when Jev is unsure', () => {
    expect(primaryScore([rule, jev(0.3)], 0.5)).toBe(rule);
  });

  it('uses rule-based when there is no Jev score', () => {
    expect(primaryScore([rule], 0.5)).toBe(rule);
  });

  it('orders the primary score first', () => {
    const confident = jev(0.9);
    expect(orderScores([rule, confident])).toEqual([confident, rule]);
  });
});
