import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("default")
@Controller("test")
export class TestController {
  ALLOWED_EMAILS = [
    "admin@example.com",
    "user1@example.com",
    "phanindra@divami.com",
  ]; // Add allowed emails here

  @UseGuards(AuthGuard("jwt"))
  @Get("protected-data")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Protected data for authorized users only" })
  @ApiResponse({ status: 200, description: "Returns protected data" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  getProtectedData(@Request() req) {
    console.log("[DEBUG] Authenticated user:", req.user);
    const userEmail = req.user?.email;
    if (!this.ALLOWED_EMAILS.includes(userEmail)) {
      throw new ForbiddenException("Forbidden");
    }
    return {
      message: "This is protected data only for authorized users.",
      data: { secret: "Top secret info!" },
    };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("protected")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Protected route - requires JWT token" })
  @ApiResponse({ status: 200, description: "Returns authenticated user info" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProtected(@Request() req) {
    return {
      message: "You are authenticated",
      user: req.user,
    };
  }
}
