// This file is being moved to controllers/auth.controller.ts

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
import { AuthService } from "../services/auth.service";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "../auth/dto/login.dto";
import { RegisterDto } from "../auth/dto/register.dto";
import { LdapLoginDto } from "../auth/dto/ldap-login.dto";
import { LdapRegisterDto } from "../auth/dto/ldap-register.dto";

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
    const user = await this.authService.validateOAuthUser(req.user);
    const { access_token } = await this.authService.login(user);

    // Get Google tokens from req.user
    const googleAccessToken = req.user.googleAccessToken;
    const googleIdToken = req.user.googleIdToken; // If available

    // Determine redirect based on admin status
    const redirectPath = user.isAdmin ? '/admin/about' : '/client/about';

    // Redirect to appropriate portal with App JWT and Google Access Token
    res.redirect(
      `http://localhost:3000${redirectPath}?token=${access_token}&google_access_token=${googleAccessToken || ""}&isAdmin=${user.isAdmin || false}`
    );
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

  @Post("ldap/register")
  @ApiOperation({ summary: "Register a new LDAP user" })
  @ApiBody({ type: LdapRegisterDto })
  @ApiResponse({ status: 201, description: "LDAP user successfully registered" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async ldapRegister(@Body() ldapRegisterDto: LdapRegisterDto) {
    return this.authService.ldapRegister(ldapRegisterDto);
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