import { Controller, Get, UseGuards, Request } from "@nestjs/common";
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
