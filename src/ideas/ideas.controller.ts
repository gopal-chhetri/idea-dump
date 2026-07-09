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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { IdeasService } from './ideas.service';
import { ScoringService } from '../scoring/scoring.service';
import { RankingService } from '../ranking/ranking.service';
import { CreateIdeaDto, UpdateIdeaDto } from './dto/idea.dto';
import { UpdateRankDto } from '../ranking/dto/update-rank.dto';

@ApiTags('Ideas')
@ApiBearerAuth()
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
  @ApiOperation({
    summary: 'Create a new idea',
    description:
      'Captures a project idea and auto-scores it against the user CV profile. Subject to the daily idea quota.',
  })
  @ApiResponse({ status: 201, description: 'Idea created and scored.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 429, description: 'Daily idea quota reached.' })
  async create(@Req() req: Request, @Body() dto: CreateIdeaDto) {
    const userId = (req.user as { id: string }).id;
    const idea = await this.ideasService.create(userId, dto);

    // Auto-score on creation
    await this.scoringService.scoreIdea(idea.id, userId);

    return this.ideasService.findOne(userId, idea.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List ranked ideas',
    description:
      'Returns the user ideas ordered by pinned, manual rank, then computed score.',
  })
  @ApiResponse({ status: 200, description: 'Ranked list of ideas.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async findAll(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.rankingService.getRankedIdeas(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single idea',
    description: 'Returns one idea with its scores and rank override.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'The requested idea.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async findOne(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    return this.ideasService.findOne(userId, ideaId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an idea',
    description:
      'Updates mutable fields of an idea (title, description, features, use case, status).',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Updated idea.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async update(
    @Req() req: Request,
    @Param('id') ideaId: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.ideasService.update(userId, ideaId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an idea',
    description: 'Permanently removes an idea and its scores/overrides.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Idea deleted.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async remove(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    await this.ideasService.remove(userId, ideaId);
    return { deleted: true };
  }

  @Post(':id/rescore')
  @ApiOperation({
    summary: 'Re-score an idea',
    description:
      'Recomputes the score for an idea against the current CV profile.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Idea with recomputed scores.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async rescore(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    await this.scoringService.scoreIdea(ideaId, userId);
    return this.ideasService.findOne(userId, ideaId);
  }

  // ── Ranking overrides ─────────────────────────────────

  @Patch(':id/rank')
  @ApiOperation({
    summary: 'Set ranking override',
    description:
      'Pins an idea to the top or forces it to a specific manual rank position.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Ranking override applied.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async updateRank(
    @Req() req: Request,
    @Param('id') ideaId: string,
    @Body() dto: UpdateRankDto,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.rankingService.setOverride(userId, ideaId, dto);
  }

  @Delete(':id/rank')
  @ApiOperation({
    summary: 'Clear ranking override',
    description:
      'Removes any pin/manual-rank override so the idea falls back to computed scoring.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Ranking override cleared.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async clearRank(@Req() req: Request, @Param('id') ideaId: string) {
    const userId = (req.user as { id: string }).id;
    await this.rankingService.clearOverride(userId, ideaId);
    return { cleared: true };
  }
}
