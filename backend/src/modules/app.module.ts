import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth.module";
import { GoogleModule } from "../google/google.module";
import { MicrosoftModule } from "../microsoft/microsoft.module";
import { LdapModule } from "../ldap/ldap.module";
import { UsersModule } from "../users/users.module";
import { TestController } from "../controllers/test.controller";
import { AppController } from "../controllers/app.controller";
import { AppService } from "../services/app.service";
import configuration from "../config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    UsersModule,
    AuthModule,
    GoogleModule,
    MicrosoftModule,
    LdapModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
