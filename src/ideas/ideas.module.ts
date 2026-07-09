import { Module } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { IdeasController } from './ideas.controller';
import { ScoringModule } from '../scoring/scoring.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [ScoringModule, RankingModule],
  controllers: [IdeasController],
  providers: [IdeasService],
  exports: [IdeasService],
})
export class IdeasModule {}
