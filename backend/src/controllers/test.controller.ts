import {
  Controller,
  Get,
  UseGuards,
  Request,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { ApiResponseDto } from "../common/dto/api-response.dto";

@ApiTags("default")
@Controller("test")
export class TestController {
  private readonly logger = new Logger(TestController.name);
  private readonly ALLOWED_EMAILS: string[];

  constructor(private configService: ConfigService) {
    // Get allowed emails from environment or use defaults
    const allowedEmailsEnv = this.configService.get<string>('ALLOWED_EMAILS');
    this.ALLOWED_EMAILS = allowedEmailsEnv 
      ? allowedEmailsEnv.split(',').map(email => email.trim())
      : ["admin@example.com", "user1@example.com", "phanindra@divami.com"];
    
    this.logger.log(`TestController initialized with ${this.ALLOWED_EMAILS.length} allowed emails`);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("protected-data")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Protected data for authorized users only" })
  @ApiResponse({ status: 200, description: "Returns protected data" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  getProtectedData(@Request() req): ApiResponseDto<{ secret: string }> {
    this.logger.log(`Protected data access attempt by user: ${req.user?.email}`);
    
    const userEmail = req.user?.email;
    if (!userEmail) {
      this.logger.warn('Protected data access denied: No email in token');
      throw new ForbiddenException("User email not found in token");
    }

    if (!this.ALLOWED_EMAILS.includes(userEmail)) {
      this.logger.warn(`Protected data access denied for email: ${userEmail}`);
      throw new ForbiddenException("You do not have permission to access this resource");
    }

    this.logger.log(`Protected data access granted to: ${userEmail}`);
    return ApiResponseDto.success(
      { secret: "Top secret info!" },
      "Protected data retrieved successfully"
    );
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("protected")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Protected route - requires JWT token" })
  @ApiResponse({ status: 200, description: "Returns authenticated user info" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getProtected(@Request() req): ApiResponseDto<any> {
    this.logger.log(`Protected route accessed by user: ${req.user?.email}`);
    return ApiResponseDto.success(
      req.user,
      "You are authenticated"
    );
  }
}
