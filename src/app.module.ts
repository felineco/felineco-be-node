// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

import authConfig from './config/auth.config';
import appConfig from './config/configuration';
import databaseConfig from './config/database.config';

import { MongooseModule } from '@nestjs/mongoose';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { CommonServicesModule } from './common/services/common-services.module';
import aiConfig from './config/ai.config';
import grpcConfig from './config/grpc.config';
import loggingConfig from './config/logging.config';
import queueConfig from './config/queue.config';
import s3Config from './config/s3.config';
import { AiAssistantsModule } from './modules/ai-assistants/ai-assistants.module';
import { AiServicesModule } from './modules/ai-services/ai-services.module';
import { AudioModule } from './modules/audio/audio.module';
import { GrpcModule } from './modules/grpc-clients/grpc.module';
import { HealthModule } from './modules/health/health.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { QueueModule } from './modules/queue/queue.module';
import { RolesModule } from './modules/roles/roles.module';
import { S3Module } from './modules/s3/s3.module';
import { SeedingModule } from './modules/seeding/seeding.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TestModule } from './modules/test/test.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        appConfig,
        authConfig,
        loggingConfig,
        s3Config,
        grpcConfig,
        queueConfig,
        aiConfig,
      ],
      envFilePath: '.env', // Mostly for local development
    }),
    // Mongoose Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongodb.uri'),
        dbName: configService.get<string>('database.mongodb.dbName'),
      }),
      inject: [ConfigService],
    }),

    // Basic Services Module
    CommonServicesModule,
    SeedingModule,
    HealthModule,
    SettingsModule,
    // Test Module for dev to play around
    TestModule,
    // AI Modules
    AiAssistantsModule,
    AiServicesModule,
    // Processing Modules
    AudioModule,
    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SessionsModule,
    S3Module,
    // Connections
    GrpcModule,
    QueueModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('/{*path}');
  }
}
