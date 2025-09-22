// src/config/queue.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  },
}));
