// src/config/s3.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  bucket: process.env.AWS_S3_BUCKET ?? '',
  presignedUrlExpiration: parseInt(
    process.env.S3_PRESIGNED_URL_EXPIRATION ?? '600',
    10,
  ), // 10 minutes in seconds
  domain: process.env.S3_DOMAIN ?? '',
}));
