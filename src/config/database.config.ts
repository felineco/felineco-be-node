// src/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongodb: {
    uri: process.env.MONGODB_URL ?? '',
    // Mongoose connection options
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
}));
