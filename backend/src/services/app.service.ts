import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    this.logger.log("GetHello method called");
    return "Welcome to SSO Sign-In Backend API!";
  }

  getHealth(): { status: string; timestamp: string } {
    this.logger.log("GetHealth method called");
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }
}
