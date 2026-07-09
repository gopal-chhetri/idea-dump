import {
  Controller,
  Get,
  Put,
  Post,
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
import { CvProfileService } from './cv-profile.service';
import { UpdateCvProfileDto, CreateCvSkillDto } from './dto/cv-profile.dto';

@ApiTags('CV Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cv-profile')
export class CvProfileController {
  constructor(private readonly cvProfileService: CvProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get CV profile',
    description: 'Returns the user professional summary and calibrated skills.',
  })
  @ApiResponse({
    status: 200,
    description: 'The CV profile (may be null if not yet created).',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async getProfile(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.getProfile(userId);
  }

  @Put()
  @ApiOperation({
    summary: 'Upsert CV summary',
    description:
      'Creates or replaces the professional summary text used to calibrate idea scoring.',
  })
  @ApiResponse({ status: 200, description: 'Updated CV profile.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async upsertProfile(@Req() req: Request, @Body() dto: UpdateCvProfileDto) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.upsertProfile(userId, dto.summaryText);
  }

  @Post('skills')
  @ApiOperation({
    summary: 'Add a skill',
    description:
      'Adds a skill/category with a proficiency weight (1-5) used for fit scoring.',
  })
  @ApiResponse({ status: 201, description: 'Skill created.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  async addSkill(@Req() req: Request, @Body() dto: CreateCvSkillDto) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.addSkill(
      userId,
      dto.name,
      dto.category,
      dto.weight,
    );
  }

  @Delete('skills/:id')
  @ApiOperation({
    summary: 'Remove a skill',
    description: 'Deletes a skill from the CV profile.',
  })
  @ApiParam({ name: 'id', description: 'Skill UUID' })
  @ApiResponse({ status: 200, description: 'Skill removed.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 404, description: 'Skill not found.' })
  async removeSkill(@Req() req: Request, @Param('id') skillId: string) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.removeSkill(userId, skillId);
  }
}
