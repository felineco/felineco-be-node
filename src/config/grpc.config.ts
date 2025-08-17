// src/config/grpc.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('grpc', () => ({
  url: process.env.GRPC_SERVICES_URL ?? 'localhost:50051',
  apiKey: process.env.GRPC_API_KEY ?? '',
  secure: process.env.GRPC_SECURE === 'false',
}));
