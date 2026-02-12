import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth.module";
import { TestController } from "../controllers/test.controller";
import configuration from "../config/configuration";

// This file is being moved to modules/app.module.ts

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
 
  ],
  controllers: [TestController],
})
export class AppModule {}
