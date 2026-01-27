import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

/**
 * This strategy demonstrates pure OAuth 2.0 (Authorization)
 * It requests access to Google Drive without getting user identity
 * Purpose: Show that OAuth is about granting permission to resources
 */
@Injectable()
export class GoogleDriveStrategy extends PassportStrategy(
  Strategy,
  "google-drive",
) {
  constructor(private configService: ConfigService) {
    const baseUrl = configService
      .get<string>("google.callbackURL")
      ?.replace("/auth/google/callback", "");
    super({
      clientID: configService.get<string>("google.clientID"),
      clientSecret: configService.get<string>("google.clientSecret"),
      callbackURL: `${baseUrl}/auth/google-drive/callback`,
      scope: [
        "https://www.googleapis.com/auth/drive.readonly", // OAuth scope for Drive access
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // With only Drive scope, we don't get user identity - just authorization
    const authData = {
      accessToken,
      refreshToken,
      scope: "drive.readonly",
      purpose: "authorization",
    };
    done(null, authData);
  }
}
