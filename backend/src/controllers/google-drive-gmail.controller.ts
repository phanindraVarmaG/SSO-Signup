import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';

// This file is being moved to controllers/google-drive-gmail.controller.ts

@Controller('auth')
export class GoogleDriveGmailController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  @Get('google-drive-gmail')
  async googleDriveGmail(@Req() req: Request, @Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_GMAIL_CALLBACK_URL') || 'http://localhost:4000/auth/google-drive-gmail/callback';
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
    return res.redirect(url);
  }

  @Get('google-drive-gmail/callback')
  async googleDriveGmailCallback(@Req() req: Request, @Res() res: Response) {
    // Handle OAuth error (e.g., user cancels consent)
    if (req.query.error) {
      const error = req.query.error as string;
      // Redirect to frontend with error message
      return res.redirect(`http://localhost:3000/admin/about?error=${encodeURIComponent(error)}`);
    }
    const code = req.query.code as string;
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_GMAIL_CALLBACK_URL') || 'http://localhost:4000/auth/google-drive-gmail/callback';
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    // Store tokens in session or DB (for demo, attach to JWT)
    const jwtPayload = {
      sub: userInfo.data.id,
      email: userInfo.data.email,
      googleTokens: tokens,
    };
    const accessToken = this.jwtService.sign(jwtPayload);
    // Redirect to Google Drive dashboard with email and access token
    res.redirect(`http://localhost:3000/admin/about?email=${encodeURIComponent(userInfo.data.email)}&access_token=${encodeURIComponent(tokens.access_token)}`);
  }
}
