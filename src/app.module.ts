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
import grpcConfig from './config/grpc.config';
import loggingConfig from './config/logging.config';
import s3Config from './config/s3.config';
import { GrpcModule } from './modules/grpc-clients/grpc.module';
import { HealthModule } from './modules/health/health.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { S3Module } from './modules/s3/s3.module';
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

    // Common Services Module
    CommonServicesModule,
    // Test Module for dev to play around
    TestModule,
    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    S3Module,
    GrpcModule,
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
