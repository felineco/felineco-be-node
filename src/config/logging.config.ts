// src/config/logging.config.ts
import { registerAs } from '@nestjs/config';
import { defaultLogLevels } from './constants/default-log-level';
import { ENV } from './constants/environment.enum';

export default registerAs('logging', () => {
  const environment = (process.env.NODE_ENV as ENV) || ENV.DEVELOPMENT;

  return {
    // Use provided log levels or fall back to defaults based on environment
    levels: defaultLogLevels[environment] || defaultLogLevels[ENV.DEVELOPMENT],
    // Additional logging options
    options: {
      // Max size for logged objects (to prevent excessive logging)
      maxObjectSize: 1000,
    },
  };
});
