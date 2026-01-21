import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("SSO Sign-In API")
    .setDescription("Single Sign-On Authentication API Documentation")
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(4000);
  console.log("🚀 Backend server is running on: http://localhost:4000");
  console.log(
    "📚 Swagger documentation available at: http://localhost:4000/api/docs",
  );
}
bootstrap();
