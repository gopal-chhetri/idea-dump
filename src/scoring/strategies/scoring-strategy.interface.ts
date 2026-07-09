import { Idea } from '../../entities/idea.entity';
import { CvProfile } from '../../entities/cv-profile.entity';

export interface ScoringResult {
  fitScore: number; // 0–100
  effortScore: number; // 0–100
  noveltyScore: number; // 0–100
}

export interface ScoringStrategy {
  score(
    idea: Idea,
    profile: CvProfile,
    userIdeas: Idea[],
  ): Promise<ScoringResult>;
}
