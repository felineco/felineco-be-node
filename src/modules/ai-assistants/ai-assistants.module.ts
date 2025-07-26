// src/modules/ai-assistants/ai-assistants.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InputSyncController } from './controllers/input-sync.controller';
import { AiAssistantsGateway } from './gateways/ai-assistants.gateway';

@Module({
  imports: [AuthModule],
  controllers: [InputSyncController],
  providers: [AiAssistantsGateway],
  exports: [AiAssistantsGateway],
})
export class AiAssistantsModule {}
