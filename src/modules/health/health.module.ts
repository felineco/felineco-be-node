// src/modules/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    TypeOrmModule, // Include this to check database health
  ],
  controllers: [HealthController],
})
export class HealthModule {}
