/**
 * @file ideas.controller.ts
 * @description NestJS Controller exposing API endpoints for managing, scoring, and ranking project ideas.
 * Authenticated endpoints with JWT guards and rate limiting.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  /**
   * Create a new project idea.
   * On successful creation, triggers an automatic scoring background job against the user's CV skills profile.
   * Rate limited to prevent quota exhaustion.
   *
   * @param req Express Request object containing authenticated user info
   * @param dto Data transfer object for idea creation details
   * @returns Detailed idea entity with initial scores
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new idea',
    description:
      'Captures a project idea and auto-scores it against the user CV profile. Subject to the daily idea quota.',
  })
  @ApiResponse({ status: 201, description: 'Idea created and scored.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 429, description: 'Daily idea quota reached.' })
  async create(@CurrentUser() userId: string, @Body() dto: CreateIdeaDto) {
    const idea = await this.ideasService.create(userId, dto);

    // Auto-score on creation
    await this.scoringService.scoreIdea(idea.id, userId);

    return this.ideasService.findOne(userId, idea.id);
  }

  /**
   * Retrieve all ideas for the logged-in user.
   * Results are returned ordered by system rankings (pinned first, then manually ranked, then score-sorted).
   *
   * @param req Express Request object containing authenticated user info
   * @returns Array of ranked idea entities
   */
  @Get()
  @ApiOperation({
    summary: 'List ranked ideas',
    description:
      'Returns the user ideas ordered by pinned, manual rank, then computed score.',
  })
  @ApiResponse({ status: 200, description: 'Ranked list of ideas.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async findAll(@CurrentUser() userId: string) {
    return this.rankingService.getRankedIdeas(userId);
  }

  /**
   * Retrieve details of a single idea by UUID.
   *
   * @param req Express Request object containing authenticated user info
   * @param ideaId Target Idea UUID
   * @returns Target idea entity with score breakdowns
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single idea',
    description: 'Returns one idea with its scores and rank override.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'The requested idea.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async findOne(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) ideaId: string,
  ) {
    return this.ideasService.findOne(userId, ideaId);
  }

  /**
   * Update mutable fields of a project idea.
   *
   * @param req Express Request object
   * @param ideaId Target Idea UUID
   * @param dto Update parameters
   * @returns Updated idea entity
   */
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
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) ideaId: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    return this.ideasService.update(userId, ideaId, dto);
  }

  /**
   * Permanently delete a project idea and its associated score records / rankings.
   *
   * @param req Express Request object
   * @param ideaId Target Idea UUID
   * @returns Status object indicating deletion confirmation
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an idea',
    description: 'Permanently removes an idea and its scores/overrides.',
  })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Idea deleted.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Idea not found.' })
  async remove(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) ideaId: string,
  ) {
    await this.ideasService.remove(userId, ideaId);
    return { deleted: true };
  }

  /**
   * Re-evaluates and scores the idea. Useful if user CV profiles or skills change.
   *
   * @param req Express Request object
   * @param ideaId Target Idea UUID
   * @returns Idea entity with updated scores
   */
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
  async rescore(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) ideaId: string,
  ) {
    // Ownership first: scoring writes to the idea's score row.
    await this.ideasService.findOne(userId, ideaId);
    await this.scoringService.scoreIdea(ideaId, userId);
    return this.ideasService.findOne(userId, ideaId);
  }

  // ── Ranking overrides ─────────────────────────────────

  /**
   * Applies custom manual ranking/pins to a specific idea.
   *
   * @param req Express Request object
   * @param ideaId Target Idea UUID
   * @param dto Rank override properties (e.g. set pin state or position index)
   * @returns Updated ranking override entity
   */
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
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) ideaId: string,
    @Body() dto: UpdateRankDto,
  ) {
    return this.rankingService.setOverride(userId, ideaId, dto);
  }

  /**
   * Clears custom manual ranking overrides, returning the idea to natural score-based sorting.
   *
   * @param req Express Request object
   * @param ideaId Target Idea UUID
   * @returns Status object indicating override cleared
   */
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
  async clearRank(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) ideaId: string,
  ) {
    await this.rankingService.clearOverride(userId, ideaId);
    return { cleared: true };
  }
}
