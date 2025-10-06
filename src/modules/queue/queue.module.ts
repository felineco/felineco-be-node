// src/modules/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { AudioQueueService } from './services/audio-queue.service';
import { QueueService } from './services/queue.service';

@Module({
  imports: [],
  providers: [QueueService, AudioQueueService],
  exports: [QueueService, AudioQueueService],
})
export class QueueModule {}
