import {
  Controller,
  Get,
  UseGuards,
  Request,
  Res,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { GoogleService } from './google.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@ApiTags('google-auth')
@Controller('auth/google')
export class GoogleController {
  private readonly logger = new Logger(GoogleController.name);

  constructor(
    private readonly googleService: GoogleService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('GoogleController initialized');
  }

  @Get()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth(@Request() req, @Query('redirect') redirect?: string) {
    // Guard redirects to Google
    this.logger.log(`Google OAuth initiation${redirect ? ` with redirect: ${redirect}` : ''}`);
  }

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  async googleAuthRedirect(
    @Request() req,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:3000';

    try {
      this.logger.log(`Google OAuth callback for user: ${req.user.email}`);
      
      const user = await this.googleService.validateGoogleUser(req.user);

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin || false,
      };
      const access_token = this.jwtService.sign(payload);

      // Get Google tokens from req.user
      const googleAccessToken = req.user.googleAccessToken;

      // Use provided redirect or determine based on admin status
      let redirectPath = redirect || (user.isAdmin ? '/admin/about' : '/client/about');

      // Ensure redirect starts with /
      if (!redirectPath.startsWith('/')) {
        redirectPath = '/' + redirectPath;
      }

      // Security: Validate redirect is a local path (prevent open redirect)
      if (redirectPath.includes('://') || redirectPath.startsWith('//')) {
        this.logger.warn(`Potential open redirect attempt: ${redirectPath}, using default`);
        redirectPath = user.isAdmin ? '/admin/about' : '/client/about';
      }

      this.logger.log(`Google OAuth successful for: ${req.user.email}, redirecting to ${redirectPath}`);

      // Redirect to appropriate portal with App JWT and Google Access Token
      res.redirect(
        `${frontendUrl}${redirectPath}?token=${access_token}&google_access_token=${googleAccessToken || ''}&isAdmin=${user.isAdmin || false}`,
      );
    } catch (error: any) {
      this.logger.error(`Google OAuth callback failed: ${error.message}`, error.stack);
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
