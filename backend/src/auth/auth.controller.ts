import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { LdapLoginDto } from "./dto/ldap-login.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password);
  }

  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  @ApiResponse({ status: 302, description: "Redirects to Google OAuth" })
  async googleAuth(@Request() req) {
    // Guard redirects to Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  @ApiResponse({ status: 302, description: "Redirects to frontend with token" })
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>("frontend.url");

    try {
      // Check if OAuth was successful
      if (!req.user) {
        return res.redirect(
          `${frontendUrl}/login?error=oauth_failed&message=Authentication failed`,
        );
      }

      // Get allowed domains from config
      const allowedDomains = this.configService.get<string[]>(
        "google.allowedDomains",
      );

      // Validate OAuth user and create/update in database
      const user = await this.authService.validateOAuthUser(
        req.user,
        allowedDomains,
      );

      // Generate JWT token
      const { access_token } = await this.authService.login(user);

      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
    } catch (error) {
      // Handle different error scenarios
      const errorMessage = encodeURIComponent(
        error.message || "Authentication failed",
      );
      const errorType = error.status === 401 ? "access_denied" : "server_error";

      res.redirect(
        `${frontendUrl}/login?error=${errorType}&message=${errorMessage}`,
      );
    }
  }

  // 🆕 LDAP Authentication Endpoints
  @Post("ldap")
  @UseGuards(AuthGuard("ldap"))
  @ApiOperation({ summary: "Login with LDAP credentials" })
  @ApiBody({ type: LdapLoginDto })
  @ApiResponse({ status: 200, description: "LDAP login successful" })
  @ApiResponse({ status: 401, description: "Invalid LDAP credentials" })
  async ldapLogin(@Body() ldapLoginDto: LdapLoginDto, @Request() req) {
    // The guard has already validated LDAP credentials
    // req.user contains the validated LDAP user
    const { access_token } = await this.authService.login(req.user);
    return { access_token, user: req.user };
  }

  // 🆕 Pure OAuth 2.0 Demo - Authorization Only (Access Google Drive)
  @Get("google-drive")
  @UseGuards(AuthGuard("google-drive"))
  @ApiOperation({
    summary: "Request Google Drive access (Pure OAuth - Authorization)",
  })
  @ApiResponse({
    status: 302,
    description: "Redirects to Google for Drive permissions",
  })
  async googleDriveAuth(@Request() req) {
    // Guard redirects to Google for Drive access
  }

  @Get("google-drive/callback")
  @UseGuards(AuthGuard("google-drive"))
  @ApiOperation({ summary: "Google Drive OAuth callback" })
  @ApiResponse({
    status: 302,
    description: "Returns access token for Drive API",
  })
  async googleDriveCallback(@Request() req, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>("frontend.url");

    try {
      // Check if OAuth was successful
      if (!req.user || !req.user.accessToken) {
        return res.redirect(
          `${frontendUrl}/auth/oauth-demo?error=oauth_failed&message=Authorization failed`,
        );
      }

      // This demonstrates pure OAuth - we get access to Drive, not user identity
      const { accessToken, refreshToken } = req.user;

      // Redirect to frontend with the access token
      res.redirect(
        `${frontendUrl}/auth/oauth-demo?access_token=${accessToken}&type=oauth`,
      );
    } catch (error) {
      const errorMessage = encodeURIComponent(
        error.message || "Authorization failed",
      );
      res.redirect(
        `${frontendUrl}/auth/oauth-demo?error=server_error&message=${errorMessage}`,
      );
    }
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  @ApiOperation({ summary: "Get user profile (protected route)" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns user profile" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req) {
    return req.user;
  }
}
