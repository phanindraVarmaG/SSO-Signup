import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false, // Show detailed validation errors
      exceptionFactory: (errors) => {
        const messages = errors.map(
          (error) => `${error.property}: ${Object.values(error.constraints).join(', ')}`
        );
        logger.error(`Validation failed: ${messages.join('; ')}`);
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );

  // Enable CORS for frontend communication
  app.enableCors({
    origin: ["http://localhost:3000", "https://test.divami.com"],
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("SSO Sign-In API")
    .setDescription("Single Sign-On Authentication API Documentation")
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("app", "Application endpoints")
    .addTag("default", "Test and utility endpoints")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Backend server is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start application: ${error.message}`, error.stack);
  process.exit(1);
});
