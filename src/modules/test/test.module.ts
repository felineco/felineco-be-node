// src/modules/health/health.module.ts
import { Module } from '@nestjs/common';
import { GrpcModule } from '../grpc-clients/grpc.module';
import { TestController } from './test.controller';

@Module({
  imports: [GrpcModule],
  controllers: [TestController],
})
export class TestModule {}
