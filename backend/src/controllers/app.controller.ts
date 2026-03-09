import { Controller, Get, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "../services/app.service";
import { ApiResponseDto } from "../common/dto/api-response.dto";

@ApiTags("app")
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Welcome message" })
  @ApiResponse({ status: 200, description: "Returns welcome message" })
  getHello(): ApiResponseDto<string> {
    this.logger.log("Welcome endpoint accessed");
    const message = this.appService.getHello();
    return ApiResponseDto.success(message, "Welcome to SSO Sign-In Backend API");
  }

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Returns server health status" })
  getHealth(): ApiResponseDto<{ status: string; timestamp: string }> {
    this.logger.log("Health check endpoint accessed");
    const health = this.appService.getHealth();
    return ApiResponseDto.success(health, "Application is healthy");
  }
}
