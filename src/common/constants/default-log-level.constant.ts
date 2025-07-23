// src/common/constants/default-log-level.constant.ts
import { LogLevel } from '@nestjs/common';
import { ENV } from '../enums/environment.enum';
// Default log levels based on environment
export const defaultLogLevels: Record<ENV, LogLevel[]> = {
  [ENV.DEV]: ['error', 'warn', 'log', 'debug', 'verbose'],
  [ENV.TEST]: ['error', 'warn'],
  [ENV.STAGE]: ['error', 'warn', 'log'],
  [ENV.PROD]: ['error', 'warn', 'log'],
};
