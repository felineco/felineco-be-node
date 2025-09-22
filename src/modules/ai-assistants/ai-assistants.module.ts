// src/modules/ai-assistants/ai-assistants.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiServicesModule } from '../ai-services/ai-services.module';
import { AudioModule } from '../audio/audio.module';
import { AuthModule } from '../auth/auth.module';
import { GrpcModule } from '../grpc-clients/grpc.module';
import { QueueModule } from '../queue/queue.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { AiAssistantsController } from './controllers/ai-assistants.controller';
import { SyncController } from './controllers/sync.controller';
import { AiAssistantsGateway } from './gateways/ai-assistants.gateway';

@Module({
  imports: [
    AuthModule,
    GrpcModule,
    UsersModule,
    SessionsModule,
    AiServicesModule,
    QueueModule,
    AudioModule,
    ConfigModule,
  ],
  controllers: [SyncController, AiAssistantsController],
  providers: [AiAssistantsGateway],
  exports: [AiAssistantsGateway],
})
export class AiAssistantsModule {}
