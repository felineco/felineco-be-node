// src/config/enums/default-log-level.enum.ts
import { LogLevel } from '@nestjs/common';
import { ENV } from './environment.enum';

// Default log levels based on environment
export const defaultLogLevels: Record<ENV, LogLevel[]> = {
  [ENV.DEVELOPMENT]: ['error', 'warn', 'log', 'debug', 'verbose'],
  [ENV.TEST]: ['error', 'warn'],
  [ENV.PRODUCTION]: ['error', 'warn', 'log'],
};
