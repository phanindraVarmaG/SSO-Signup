import { Controller, Get, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("status")
  @ApiOperation({ summary: "Get authentication service status" })
  @ApiResponse({
    status: 200,
    description: "Returns authentication service status",
  })
  getAuthStatus(): { message: string } {
    return this.authService.getAuthStatus();
  }

  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
        password: { type: "string", example: "password123" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Login successful" })
  login(@Body() loginDto: { email: string; password: string }): {
    message: string;
    user: { email: string };
  } {
    return this.authService.login(loginDto);
  }

  @Post("logout")
  @ApiOperation({ summary: "User logout" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  logout(): { message: string } {
    return this.authService.logout();
  }
}
