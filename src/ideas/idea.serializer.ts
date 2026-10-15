import { wrap } from '@mikro-orm/core';
import { Idea } from '../entities/idea.entity';
import { IdeaScore } from '../entities/idea-score.entity';
import { orderScores } from '../scoring/primary-score';

/**
 * JSON for an idea, with its primary score (Jev when confident, otherwise
 * rule-based) first in `scores` so clients can simply read scores[0].
 */
export function serializeIdea(idea: Idea): Record<string, unknown> {
  const json = wrap(idea).toObject() as Record<string, unknown>;
  const scores = json.scores;
  if (
    Array.isArray(scores) &&
    scores.every((s) => typeof s === 'object' && s !== null)
  ) {
    json.scores = orderScores(scores as IdeaScore[]);
  }
  return json;
}
