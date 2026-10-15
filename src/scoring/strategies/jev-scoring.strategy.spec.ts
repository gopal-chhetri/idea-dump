import { TypeSafeClient } from '@typesafe-ai/sdk';
import { JevScoringStrategy } from './jev-scoring.strategy';
import { Idea } from '../../entities/idea.entity';
import { CvSkill } from '../../entities/cv-skill.entity';

const idea = (id: string, title: string): Idea =>
  ({
    id,
    title,
    description: 'A dashboard for tracking habits',
    features: ['charts', 'reminders'],
    useCase: 'Personal productivity',
  }) as Idea;

/** The parts of the systemOne request these tests inspect. */
interface SentRequest {
  state: {
    idea: { title: string };
    developer: { skills: unknown[]; cvSummary: string };
    otherIdeaTitles: string[];
  };
  questions: Record<string, unknown>;
}

function fakeClient(
  answers: Record<string, { score: number; confidence: number }>,
) {
  const systemOne = jest.fn().mockResolvedValue({ answers });
  return { client: { systemOne } as unknown as TypeSafeClient, systemOne };
}

describe('JevScoringStrategy', () => {
  it('maps rubric positions to 0-100 and keeps the lowest confidence', async () => {
    const { client } = fakeClient({
      fit: { score: 4, confidence: 0.9 },
      effort: { score: 2, confidence: 0.7 },
      novelty: { score: 1.5, confidence: 0.8 },
    });
    const result = await new JevScoringStrategy(client).score(
      idea('i1', 'Habit tracker'),
      [],
      [],
    );
    expect(result).toEqual({
      fitScore: 100,
      effortScore: 50,
      noveltyScore: 38, // 1.5 of 4 levels, between rubric points
      confidence: 0.7,
    });
  });

  it('sends the idea, skills, summary and other idea titles as state', async () => {
    const { client, systemOne } = fakeClient({
      fit: { score: 0, confidence: 1 },
      effort: { score: 0, confidence: 1 },
      novelty: { score: 0, confidence: 1 },
    });
    const skills = [
      { name: 'React', category: 'framework', weight: 4 },
    ] as CvSkill[];
    const current = idea('i1', 'Habit tracker');

    await new JevScoringStrategy(client).score(
      current,
      skills,
      [current, idea('i2', 'Recipe planner')],
      'Frontend engineer',
    );

    const [{ state, questions }] = systemOne.mock.calls[0] as [SentRequest];
    expect(state.idea.title).toBe('Habit tracker');
    expect(state.developer.skills).toEqual([
      { name: 'React', category: 'framework', proficiency: '4/5' },
    ]);
    expect(state.developer.cvSummary).toBe('Frontend engineer');
    // The idea being scored is not compared against itself.
    expect(state.otherIdeaTitles).toEqual(['Recipe planner']);
    expect(Object.keys(questions)).toEqual(['fit', 'effort', 'novelty']);
  });

  it('is disabled without a client', () => {
    expect(new JevScoringStrategy(null).enabled).toBe(false);
  });
});
