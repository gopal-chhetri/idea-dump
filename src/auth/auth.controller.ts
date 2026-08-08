import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from '../entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new local account',
    description: 'Creates a user and returns an access + refresh token pair.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created. Returns access + refresh tokens.',
  })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'Log in with email + password',
    description:
      'Validates credentials via Passport LocalStrategy and issues tokens.',
  })
  @ApiBody({
    schema: {
      example: { email: 'user@gmail.com', password: 'password123' },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns access + refresh tokens.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Req() req: Request) {
    return this.authService.login(req.user as User);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate refresh token',
    description:
      'Exchanges an opaque refresh token for a new access + refresh token pair. Previous token is revoked.',
  })
  @ApiResponse({ status: 200, description: 'New token pair issued.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token.',
  })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // ── Google OAuth ──────────────────────────────────────

  @UseGuards(AuthGuard('google'))
  @Get('google')
  @ApiOperation({
    summary: 'Initiate Google OAuth flow',
    description: 'Redirects the browser to the Google consent screen.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google.' })
  googleLogin() {
    // Passport redirects to Google
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles the Google OAuth redirect and issues tokens. Redirects to FRONTEND_URL with tokens in query string.',
  })
  @ApiResponse({
    status: 302,
    description:
      'Redirects to frontend with accessToken and refreshToken query params.',
  })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const url = await this.authService.oauthRedirectUrl(req.user as User);
    res.redirect(url);
  }
}
