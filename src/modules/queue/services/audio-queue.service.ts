// src/modules/queue/services/audio-queue.service.ts
import { Deque } from '@datastructures-js/deque';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AudioMessage } from 'src/common/interfaces/audio-message.interface';
import { AppLoggerService } from 'src/common/services/logger.service';

interface ProcessingQueue {
  items: Deque<AudioMessage>;
  processing: boolean;
  processor?: (items: AudioMessage[]) => Promise<void>;
}

@Injectable()
export class AudioQueueService implements OnModuleDestroy {
  private queues = new Map<string, ProcessingQueue>();

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(AudioQueueService.name);
  }

  onModuleDestroy() {
    this.queues.clear();
  }

  async registerProcessor(
    userId: string,
    audioId: string,
    processor: (items: AudioMessage[]) => Promise<void>,
  ): Promise<string> {
    const key = this.getQueueKey(userId, audioId);
    const items = new Deque<AudioMessage>([]);

    this.queues.set(key, {
      items,
      processing: false,
      processor,
    });

    return key;
  }

  async publishAndProcessAudio(audioMessage: AudioMessage): Promise<void> {
    const key = this.getQueueKey(audioMessage.userId, audioMessage.id);
    const queue = this.queues.get(key);

    if (!queue) {
      this.logger.warn(
        `The queue ${key} does not exist when trying to publish audioChunk.`,
      );
      return;
    }

    queue.items.pushBack(audioMessage);

    if (!queue.processing) {
      void this.process(key);
    }
  }

  async cleanupQueue(key: string): Promise<void> {
    this.queues.delete(key);
  }

  private async process(key: string): Promise<void> {
    const queue = this.queues.get(key);
    if (!queue || queue.processing) return;

    queue.processing = true;

    try {
      const batch = queue.items.toArray();

      if (batch.length > 0 && queue.processor) {
        await queue.processor(batch);
      }

      // Remove exactly the number of items that were processed
      for (let i = 0; i < batch.length; i++) {
        queue.items.popFront(); // Remove from front
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      queue.processing = false;
    }
  }

  private getQueueKey(userId: string, audioId: string): string {
    return `${userId}.${audioId}`;
  }
}
