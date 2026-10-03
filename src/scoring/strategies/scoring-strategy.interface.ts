import { Idea } from '../../entities/idea.entity';
import { CvSkill } from '../../entities/cv-skill.entity';

export interface ScoringResult {
  fitScore: number; // 0-100
  effortScore: number; // 0-100
  noveltyScore: number; // 0-100
}

export interface ScoringStrategy {
  score(
    idea: Idea,
    skills: CvSkill[],
    userIdeas: Idea[],
  ): Promise<ScoringResult>;
}
