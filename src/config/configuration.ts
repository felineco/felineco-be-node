// src/config/configuration.ts
import { registerAs } from '@nestjs/config';
import { ENV } from './constants/environment.enum';

export default registerAs('app', () => ({
  environment: (process.env.NODE_ENV as ENV) ?? ENV.DEVELOPMENT,
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    title: process.env.SWAGGER_TITLE ?? 'API Documentation',
    description: process.env.SWAGGER_DESCRIPTION ?? 'API Description',
    version: process.env.SWAGGER_VERSION ?? '1.0',
  },
}));
