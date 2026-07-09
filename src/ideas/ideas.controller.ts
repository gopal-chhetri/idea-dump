import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { IdeasService } from './ideas.service';
import { ScoringService } from '../scoring/scoring.service';
import { RankingService } from '../ranking/ranking.service';
import { CreateIdeaDto, UpdateIdeaDto } from './dto/idea.dto';
import { UpdateRankDto } from '../ranking/dto/update-rank.dto';

@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(
    private readonly ideasService: IdeasService,
    private readonly scoringService: ScoringService,
    private readonly rankingService: RankingService,
  ) {}

  @UseGuards(RateLimitGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateIdeaDto) {
    const userId = (req.user as { id: string }).id;
    const idea = await this.ideasService.create(userId, dto);

    // Auto-score on creation
    await this.scoringService.scoreIdea(idea.id, userId);

    return this.ideasService.findOne(userId, idea.id);
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.rankingService.getRankedIdeas(userId);
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    return this.ideasService.findOne(userId, ideaId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') ideaId: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.ideasService.update(userId, ideaId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    await this.ideasService.remove(userId, ideaId);
    return { deleted: true };
  }

  @Post(':id/rescore')
  async rescore(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    await this.scoringService.scoreIdea(ideaId, userId);
    return this.ideasService.findOne(userId, ideaId);
  }

  // ── Ranking overrides ─────────────────────────────────

  @Patch(':id/rank')
  async updateRank(
    @Req() req: Request,
    @Param('id') ideaId: string,
    @Body() dto: UpdateRankDto,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.rankingService.setOverride(userId, ideaId, dto);
  }

  @Delete(':id/rank')
  async clearRank(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    await this.rankingService.clearOverride(userId, ideaId);
    return { cleared: true };
  }
}
