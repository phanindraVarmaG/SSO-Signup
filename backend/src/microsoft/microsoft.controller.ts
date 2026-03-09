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
import { MicrosoftService } from './microsoft.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@ApiTags('microsoft-auth')
@Controller('auth/microsoft')
export class MicrosoftController {
  private readonly logger = new Logger(MicrosoftController.name);

  constructor(
    private readonly microsoftService: MicrosoftService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('MicrosoftController initialized');
  }

  @Get()
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Initiate Microsoft OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Microsoft OAuth' })
  async microsoftAuth(@Request() req, @Query('redirect') redirect?: string) {
    // Guard redirects to Microsoft
    this.logger.log(`Microsoft OAuth initiation${redirect ? ` with redirect: ${redirect}` : ''}`);
  }

  @Get('callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  async microsoftAuthRedirect(
    @Request() req,
    @Res() res: Response,
    @Query('redirect') redirect?: string,
  ) {
    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:3000';

    try {
      this.logger.log(`Microsoft OAuth callback for user: ${req.user.email}`);
      
      const user = await this.microsoftService.validateMicrosoftUser(req.user);

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        isAdmin: user.isAdmin || false,
      };
      const access_token = this.jwtService.sign(payload);

      // Get Microsoft tokens from req.user
      const microsoftAccessToken = req.user.microsoftAccessToken;

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

      this.logger.log(`Microsoft OAuth successful for: ${req.user.email}, redirecting to ${redirectPath}`);

      // Redirect to appropriate portal with App JWT and Microsoft Access Token
      res.redirect(
        `${frontendUrl}${redirectPath}?token=${access_token}&microsoft_access_token=${microsoftAccessToken || ''}&isAdmin=${user.isAdmin || false}`,
      );
    } catch (error: any) {
      this.logger.error(`Microsoft OAuth callback failed: ${error.message}`, error.stack);
      res.redirect(`${frontendUrl}/login?error=microsoft_oauth_failed`);
    }
  }
}
