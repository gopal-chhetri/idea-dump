import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CvProfileService } from './cv-profile.service';
import { UpdateCvProfileDto, CreateCvSkillDto } from './dto/cv-profile.dto';

/** Upper bound for uploaded CVs; PDFs are parsed in memory. */
const MAX_CV_BYTES = 2 * 1024 * 1024;

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
  async getProfile(@CurrentUser() userId: string) {
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
  async upsertProfile(
    @CurrentUser() userId: string,
    @Body() dto: UpdateCvProfileDto,
  ) {
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
  async addSkill(@CurrentUser() userId: string, @Body() dto: CreateCvSkillDto) {
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
  async removeSkill(
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) skillId: string,
  ) {
    return this.cvProfileService.removeSkill(userId, skillId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_CV_BYTES, files: 1 },
    }),
  )
  @ApiOperation({
    summary: 'Upload CV file',
    description:
      'Upload a PDF or TXT file to extract professional summary and skills via text parsing.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF or TXT file containing CV/resume content',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Extracted summary and skills from the uploaded file.',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing, unsupported or empty file.',
  })
  @ApiResponse({ status: 413, description: 'File larger than 2 MB.' })
  async uploadCv(
    @CurrentUser() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A PDF or TXT file is required.');
    }
    return this.cvProfileService.uploadAndExtract(
      userId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }
}
