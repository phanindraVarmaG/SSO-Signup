import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth.module";
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
    AuthModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
