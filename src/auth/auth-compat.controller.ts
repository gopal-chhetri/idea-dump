import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

/**
 * Compatibility controller for the Google OAuth callback registered with an
 * `/api/auth` prefix. The backend has no global `/api` prefix, so a Google
 * OAuth App configured with the (previously misdocumented) `/api/...` callback
 * path used to hit a 404. Serving the same routes here keeps both prefixes
 * working.
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AuthCompatController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('google'))
  @Get('google')
  @ApiOperation({
    summary: 'Initiate Google OAuth flow (compat `/api` prefix)',
    description: 'Redirects the browser to the Google consent screen.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google.' })
  googleLogin() {
    // Passport redirects to Google
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback (compat `/api` prefix)',
    description:
      'Handles the Google OAuth redirect and issues tokens. Redirects to FRONTEND_URL with tokens in query string.',
  })
  @ApiResponse({ status: 302, description: 'Redirects to frontend.' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const url = await this.authService.oauthRedirectUrl(req.user as User);
    res.redirect(url);
  }
}
