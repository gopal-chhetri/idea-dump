import { Module } from '@nestjs/common';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { ScoringService } from './scoring.service';
import { RuleBasedScoringStrategy } from './strategies/rule-based-scoring.strategy';
import {
  JevScoringStrategy,
  TYPESAFE_CLIENT,
} from './strategies/jev-scoring.strategy';
import { jevTimeoutMs, typesafeApiKey } from '../config/secrets';

@Module({
  providers: [
    ScoringService,
    RuleBasedScoringStrategy,
    JevScoringStrategy,
    {
      provide: TYPESAFE_CLIENT,
      // Without an API key Jev is off and ideas are scored rule-based only.
      useFactory: (): TypeSafeClient | null => {
        const apiKey = typesafeApiKey();
        if (!apiKey) return null;
        return new TypeSafeClient({
          apiKey,
          timeout: jevTimeoutMs(),
          // Scoring runs inline when an idea is created: fail fast and fall
          // back to the rule-based score rather than wait out retries.
          retry: { maxRetries: 0 },
        });
      },
    },
  ],
  exports: [ScoringService],
})
export class ScoringModule {}
