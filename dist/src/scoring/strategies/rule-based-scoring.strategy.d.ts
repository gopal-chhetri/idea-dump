import { ScoringStrategy, ScoringResult } from './scoring-strategy.interface';
import { Idea } from '../../entities/idea.entity';
import { CvProfile } from '../../entities/cv-profile.entity';
export declare class RuleBasedScoringStrategy implements ScoringStrategy {
    score(idea: Idea, profile: CvProfile, userIdeas: Idea[]): Promise<ScoringResult>;
    private computeFitScore;
    private computeEffortScore;
    private computeNoveltyScore;
    private tokenize;
}
