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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvProfileService } from './cv-profile.service';
import { UpdateCvProfileDto, CreateCvSkillDto } from './dto/cv-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('cv-profile')
export class CvProfileController {
  constructor(private readonly cvProfileService: CvProfileService) {}

  @Get()
  async getProfile(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.getProfile(userId);
  }

  @Put()
  async upsertProfile(
    @Req() req: Request,
    @Body() dto: UpdateCvProfileDto,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.upsertProfile(userId, dto.summaryText);
  }

  @Post('skills')
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
  async removeSkill(@Req() req: Request, @Param('id') skillId: string) {
    const userId = (req.user as { id: string }).id;
    return this.cvProfileService.removeSkill(userId, skillId);
  }
}
