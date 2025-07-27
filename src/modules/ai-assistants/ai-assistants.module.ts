// src/modules/ai-assistants/ai-assistants.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GrpcModule } from '../grpc-clients/grpc.module';
import { AiAssistantsController } from './controllers/ai-assistants.controller';
import { SyncController } from './controllers/sync.controller';
import { AiAssistantsGateway } from './gateways/ai-assistants.gateway';

@Module({
  imports: [AuthModule, GrpcModule],
  controllers: [SyncController, AiAssistantsController],
  providers: [AiAssistantsGateway],
  exports: [AiAssistantsGateway],
})
export class AiAssistantsModule {}
