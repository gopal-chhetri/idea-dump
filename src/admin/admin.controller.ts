import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UserRole } from '../entities/enums';
import {
  CreateUserDto,
  PaginationQueryDto,
  UpdateUserDto,
  UpsertSettingDto,
} from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({ status: 200, description: 'User and idea counts.' })
  async getStats() {
    return this.adminService.getStats();
  }

  // ── Users ───────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Paginated user list.' })
  async listUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.listUsers(query.page, query.limit);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'User created.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async createUser(@Body() body: CreateUserDto) {
    return this.adminService.createUser(body);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'The user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User updated.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async updateUser(
    @CurrentUser() actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.adminService.updateUser(actorId, id, body);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted.' })
  async deleteUser(
    @CurrentUser() actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.deleteUser(actorId, id);
  }

  // ── Ideas ───────────────────────────────────────────────

  @Get('ideas')
  @ApiOperation({ summary: 'List all ideas' })
  @ApiResponse({ status: 200, description: 'Paginated idea list.' })
  async listIdeas(@Query() query: PaginationQueryDto) {
    return this.adminService.listIdeas(query.page, query.limit);
  }

  @Delete('ideas/:id')
  @ApiOperation({ summary: 'Delete an idea' })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Idea deleted.' })
  async deleteIdea(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteIdea(id);
  }

  @Post('ideas/:id/rescore')
  @ApiOperation({ summary: 'Re-score a single idea' })
  @ApiParam({ name: 'id', description: 'Idea UUID' })
  @ApiResponse({ status: 200, description: 'Idea rescored.' })
  async rescoreIdea(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rescoreIdea(id);
  }

  @Post('rescore/all')
  @ApiOperation({ summary: 'Re-score all ideas' })
  @ApiResponse({ status: 200, description: 'All ideas rescored.' })
  async rescoreAll() {
    return this.adminService.rescoreAll();
  }

  // ── Settings ────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'List system settings' })
  @ApiResponse({
    status: 200,
    description: 'System settings with decrypted values.',
  })
  async listSettings() {
    return this.adminService.listSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Create or update a system setting' })
  @ApiResponse({ status: 200, description: 'Setting upserted.' })
  async upsertSetting(@Body() body: UpsertSettingDto) {
    return this.adminService.upsertSetting(body.key, body.value);
  }
}
