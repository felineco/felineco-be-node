// src/modules/queue/services/queue.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Channel, ChannelModel, ConsumeMessage, Options } from 'amqplib';
import { AudioMessage } from 'src/common/interfaces/audio-message.interface';
import { AppLoggerService } from 'src/common/services/logger.service';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly rabbitmqUrl: string;

  // Consumer tracking
  private activeConsumers = new Set<string>(); // consumerTag

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(QueueService.name);
    this.rabbitmqUrl =
      this.configService.get<string>('queue.rabbitmq.url') ?? '';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      // This is crucial for ensuring that we only run one consumer at a time
      await this.channel.prefetch(1); // Process one message at a time
      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ`);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error(
        `Error disconnecting from RabbitMQ: ${JSON.stringify(error)}`,
      );
    }
  }

  private async createQueue(
    queueName: string,
    config: { autoDelete?: boolean } = { autoDelete: true },
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      await this.channel.assertQueue(queueName, {
        durable: true,
        autoDelete: config.autoDelete,
        arguments: {
          'x-expires': 3600000, // Queue auto-deletes after 1 hour of inactivity
          'x-message-ttl': 1800000, // Messages expire after 30 minutes
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create queue ${queueName}: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  private async consume(
    queue: string,
    onMessage: (msg: ConsumeMessage | null) => void,
    options?: Options.Consume,
  ): Promise<amqp.Replies.Consume> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    // Wrapper for this.channel.consume to track active consumers
    const result = await this.channel.consume(queue, onMessage, options);
    // Track the consumer tag
    this.activeConsumers.add(result.consumerTag);
    return result;
  }

  async cancelConsumer(consumerTag: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    await this.channel.cancel(consumerTag);
    this.activeConsumers.delete(consumerTag);
  }

  async consumeAudioChunk(
    userId: string,
    audioId: string,
    callback: (
      userId: string,
      audioId: string,
      audioInfos: { audioChunk: Buffer; audioMessage: AudioMessage }[],
    ) => Promise<void>,
  ): Promise<string> {
    const queueName = this.getTranscriptionQueueName(userId, audioId);
    await this.createQueue(queueName);

    const drainAndProcess = async (oldestMsg: amqp.ConsumeMessage) => {
      const allMessages: (amqp.ConsumeMessage | amqp.GetMessage)[] = [
        oldestMsg,
      ];

      try {
        // Drain all available messages from the queue
        while (true) {
          const msg = await this.channel?.get(queueName, { noAck: false });
          if (msg === false || msg === undefined) break; // No more messages
          allMessages.push(msg);
        }

        // Convert all messages to audioInfos
        const audioInfos = allMessages.map((m) => {
          const headers = m.properties.headers as {
            id: string;
            order: number;
            isLargeChunk: boolean;
            userId: string;
          };

          const audioMessage: AudioMessage = {
            id: headers.id,
            order: headers.order,
            isLargeChunk: headers.isLargeChunk,
            userId: headers.userId,
          };

          return { audioChunk: m.content, audioMessage };
        });

        // Process all messages
        await callback(userId, audioId, audioInfos);
        // Ack all messages
        allMessages.forEach((m) => this.channel?.ack(m));
      } catch (error) {
        this.logger.error(
          `Error processing messages from queue ${queueName}: ${JSON.stringify(error)}`,
        );
        // Nack all messages to requeue them
        allMessages.forEach((m) => this.channel?.nack(m, false, true));
      }
    };

    // Set up consumer that just triggers the drain process
    const result = await this.consume(queueName, (msg) => {
      if (msg) {
        // Trigger drain and process (fire and forget)
        void drainAndProcess(msg);
      }
    });

    return result.consumerTag;
  }

  async publishAudioChunk(
    audioChunk: Buffer,
    audioMessage: AudioMessage,
  ): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    // Publish the audio chunk to the specified topic
    try {
      return this.channel.sendToQueue(
        this.getTranscriptionQueueName(audioMessage.userId, audioMessage.id),
        audioChunk,
        {
          headers: {
            id: audioMessage.id,
            order: audioMessage.order,
            isLargeChunk: audioMessage.isLargeChunk,
            userId: audioMessage.userId,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish audio chunk: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  async consumeAnalysisTrigger(
    userId: string,
    callback: (userId: string) => Promise<void>,
  ): Promise<string> {
    const queueName = this.getAnalysisTriggerQueueName(userId);
    await this.createQueue(queueName);

    const emptyWholeQueueThenProcessOnce = async (
      oldestMsg: amqp.ConsumeMessage,
    ) => {
      const allMessagesLeft: amqp.GetMessage[] = [];

      try {
        // Drain all available messages from the queue
        while (true) {
          const msg = await this.channel?.get(queueName, { noAck: false });
          if (msg === false || msg === undefined) break; // No more messages
          allMessagesLeft.push(msg);
        }
        // Ack all messages except the original one (which will be acknowledged when successfully processed)
        allMessagesLeft.forEach((m) => this.channel?.ack(m));
        // Process all messages
        await callback(userId);
        // Ack the original messages
        this.channel?.ack(oldestMsg);
      } catch (error) {
        this.logger.error(
          `Error processing messages from queue ${queueName}: ${JSON.stringify(error)}`,
        );
        // Only Nack the original message to requeue it
        this.channel?.nack(oldestMsg, false, true);
      }
    };

    // Set up consumer that just triggers the drain process
    const result = await this.consume(queueName, (msg) => {
      if (msg) {
        // Trigger drain and process (fire and forget)
        void emptyWholeQueueThenProcessOnce(msg);
      }
    });

    return result.consumerTag;
  }

  async publishAnalysisTrigger(userId: string): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    // Publish the audio chunk to the specified topic
    try {
      return this.channel.sendToQueue(
        this.getAnalysisTriggerQueueName(userId),
        Buffer.from(''),
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish audio chunk: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  async getgetConsumerTags(): Promise<Set<string>> {
    return this.activeConsumers;
  }

  private getTranscriptionQueueName(userId: string, audioId: string): string {
    return `nfd.transcription.${userId}.${audioId}`;
  }

  private getAnalysisTriggerQueueName(userId: string): string {
    return `nfd.analysis-trigger.${userId}`;
  }
}
