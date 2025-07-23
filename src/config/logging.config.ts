// src/config/logging.config.ts
import { registerAs } from '@nestjs/config';
import { ENV } from 'src/common/enums/environment.enum';
import { defaultLogLevels } from '../common/constants/default-log-level.constant';

export default registerAs('logging', () => {
  const environment = (process.env.NODE_ENV as ENV) ?? ENV.DEV;

  return {
    // Use provided log levels or fall back to defaults based on environment
    levels: defaultLogLevels[environment] ?? defaultLogLevels[ENV.DEV],
    // Additional logging options
    options: {
      // Max size for logged objects (to prevent excessive logging)
      maxObjectSize: 1000,
    },
  };
});
