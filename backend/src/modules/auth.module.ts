import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";
import { JwtStrategy } from "../auth/strategies/jwt.strategy";
import { GoogleStrategy } from "../auth/strategies/google.strategy";
import { LdapAuthStrategy } from "../auth/strategies/ldap.strategy"; // 🆕 Added
import { GoogleDriveGmailController } from "../controllers/google-drive-gmail.controller";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>("jwt.secret") || '0123456789abcdef',
          signOptions: {
            expiresIn: '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, LdapAuthStrategy], // 🆕 Added LdapAuthStrategy
  controllers: [AuthController, GoogleDriveGmailController],
})
export class AuthModule {}

// This file is being moved to modules/auth.module.ts