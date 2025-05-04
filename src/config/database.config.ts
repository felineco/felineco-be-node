// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { ENV } from './constants/environment.enum';

export default registerAs('database', () => ({
  postgres: {
    type: 'postgres',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USERNAME ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DATABASE ?? 'myapp',
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== ENV.PRODUCTION,
    logging: false, // process.env.NODE_ENV !== ENV.PRODUCTION,
  },
}));
