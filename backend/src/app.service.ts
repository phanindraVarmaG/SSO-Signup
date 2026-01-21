import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Welcome to SSO Sign-In Backend API!";
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
    };
  }
}
