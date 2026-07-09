import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { RuleBasedScoringStrategy } from './strategies/rule-based-scoring.strategy';

@Module({
  providers: [ScoringService, RuleBasedScoringStrategy],
  exports: [ScoringService],
})
export class ScoringModule {}
