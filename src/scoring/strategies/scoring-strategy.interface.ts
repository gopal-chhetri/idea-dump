import { Idea } from '../../entities/idea.entity';
import { CvSkill } from '../../entities/cv-skill.entity';

export interface ScoringResult {
  fitScore: number; // 0-100
  effortScore: number; // 0-100
  noveltyScore: number; // 0-100
  /** 0-1, for strategies that report it (Jev); undefined for heuristics. */
  confidence?: number;
}

export interface ScoringStrategy {
  score(
    idea: Idea,
    skills: CvSkill[],
    userIdeas: Idea[],
    /** Free-text CV summary, for strategies that can use it. */
    cvSummary?: string,
  ): Promise<ScoringResult>;
}
