// src/modules/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { QueueService } from './services/queue.service';

@Module({
  imports: [],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
