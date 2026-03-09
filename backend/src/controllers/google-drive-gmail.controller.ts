import { Controller, Get, Req, Res, UseGuards, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class GoogleDriveGmailController {
  private readonly logger = new Logger(GoogleDriveGmailController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('GoogleDriveGmailController initialized');
  }

  @Get('google-drive-gmail')
  @ApiOperation({ summary: 'Initiate Google Drive and Gmail OAuth' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  async googleDriveGmail(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.log('Initiating Google Drive/Gmail OAuth flow');
      
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_GMAIL_CALLBACK_URL') || 'https://test.divami.com/auth/google-drive-gmail/callback';
      
      if (!clientId || !clientSecret) {
        this.logger.error('Google OAuth credentials not configured');
        throw new InternalServerErrorException('Google OAuth not configured');
      }

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'profile',
        'email',
        'openid',
      ];
      
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
      });
      
      this.logger.log('Redirecting to Google OAuth consent screen');
      return res.redirect(url);
    } catch (error: any) {
      this.logger.error(`Google Drive/Gmail OAuth initiation failed: ${error.message}`, error.stack);
      const frontendUrl = this.configService.get<string>('frontend.url') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/admin/about?error=oauth_init_failed`);
    }
  }

  @Get('google-drive-gmail/callback')
  @ApiOperation({ summary: 'Google Drive and Gmail OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleDriveGmailCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('frontend.url') || 'http://localhost:3000';
    
    try {
      // Handle OAuth error (e.g., user cancels consent)
      if (req.query.error) {
        const error = req.query.error as string;
        this.logger.warn(`Google OAuth callback error: ${error}`);
        return res.redirect(`${frontendUrl}/admin/about?error=${encodeURIComponent(error)}`);
      }

      const code = req.query.code as string;
      if (!code) {
        this.logger.error('No authorization code received from Google');
        throw new BadRequestException('Authorization code missing');
      }

      this.logger.log('Processing Google Drive/Gmail OAuth callback');
      
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_GMAIL_CALLBACK_URL') || 'https://test.divami.com/auth/google-drive-gmail/callback';
      
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      if (!userInfo.data.email) {
        this.logger.error('No email received from Google');
        throw new BadRequestException('User email not available');
      }

      this.logger.log(`Google Drive/Gmail OAuth successful for user: ${userInfo.data.email}`);
      
      // Store tokens in session or DB (for demo, attach to JWT)
      const jwtPayload = {
        sub: userInfo.data.id,
        email: userInfo.data.email,
        googleTokens: tokens,
      };
      const accessToken = this.jwtService.sign(jwtPayload);
      
      // Redirect to Google Drive dashboard with email and access token
      this.logger.log(`Redirecting to admin dashboard for: ${userInfo.data.email}`);
      res.redirect(`${frontendUrl}/admin/about?email=${encodeURIComponent(userInfo.data.email)}&access_token=${encodeURIComponent(tokens.access_token || '')}`);
    } catch (error: any) {
      this.logger.error(`Google Drive/Gmail OAuth callback failed: ${error.message}`, error.stack);
      res.redirect(`${frontendUrl}/admin/about?error=oauth_callback_failed`);
    }
  }
}
