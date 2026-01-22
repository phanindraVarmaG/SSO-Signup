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
    // Validate OAuth user and create/update in database
    const user = await this.authService.validateOAuthUser(req.user);

    // Generate JWT token
    const { access_token } = await this.authService.login(user);

    // Redirect to frontend with token
    const frontendUrl = this.configService.get<string>("frontend.url");
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
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