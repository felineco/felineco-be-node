// src/main.ts
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLoggerService } from './common/services/logger.service';

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: new AppLoggerService().setContext('NestFactory'),
  });

  const configService = app.get(ConfigService);

  // Create logger instance for bootstrap process
  const bootstrapLogger = new AppLoggerService(configService).setContext(
    'Bootstrap',
  );

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix ?? '');
  bootstrapLogger.log(`API prefix set to: ${apiPrefix}`);

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });
  bootstrapLogger.log('CORS enabled');

  // Swagger documentation
  if (configService.get<boolean>('app.swagger.enabled') ?? false) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(
        configService.get<string>('app.swagger.title') ?? 'API Documentation',
      )
      .setDescription(
        configService.get<string>('app.swagger.description') ??
          'API Description',
      )
      .setVersion(configService.get<string>('app.swagger.version') ?? '1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    bootstrapLogger.log(`Swagger documentation enabled at /${apiPrefix}/docs`);
  }

  // Start the server
  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
  bootstrapLogger.log(`Application running on port ${port}`);
  bootstrapLogger.log(
    `Environment: ${configService.get<string>('app.environment')}`,
  );
}

void bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
