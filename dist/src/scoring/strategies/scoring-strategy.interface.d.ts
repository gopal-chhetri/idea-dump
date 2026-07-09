import { Idea } from '../../entities/idea.entity';
import { CvProfile } from '../../entities/cv-profile.entity';
export interface ScoringResult {
    fitScore: number;
    effortScore: number;
    noveltyScore: number;
}
export interface ScoringStrategy {
    score(idea: Idea, profile: CvProfile, userIdeas: Idea[]): Promise<ScoringResult>;
}
