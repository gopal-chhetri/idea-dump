import { IdeaScore } from '../entities/idea-score.entity';
import { ScoringMethod } from '../entities/enums';
import { jevMinConfidence } from '../config/secrets';

type ScoreLike = Pick<IdeaScore, 'scoringMethod' | 'confidence'>;

/**
 * The score an idea is ranked and displayed by: the Jev score when Jev was
 * confident enough, otherwise the rule-based score.
 */
export function primaryScore<T extends ScoreLike>(
  scores: readonly T[],
  minConfidence = jevMinConfidence(),
): T | undefined {
  const jev = scores.find((s) => s.scoringMethod === ScoringMethod.LLM);
  if (jev && (jev.confidence ?? 0) >= minConfidence) return jev;
  return (
    scores.find((s) => s.scoringMethod === ScoringMethod.RULE_BASED) ??
    scores[0]
  );
}

/** Scores ordered so the primary score comes first (the SPA reads [0]). */
export function orderScores<T extends ScoreLike>(scores: readonly T[]): T[] {
  const primary = primaryScore(scores);
  return primary
    ? [primary, ...scores.filter((s) => s !== primary)]
    : [...scores];
}
