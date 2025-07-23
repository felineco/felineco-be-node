// src/modules/s3/dtos/responses/presigned-url-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    example:
      'https://your-bucket.s3.amazonaws.com/images/1234567890-my-file.jpg?X-Amz-Algorithm=...',
    description: 'Pre-signed URL for uploading the file',
  })
  presignedUrl: string;

  @ApiProperty({
    example: 'uploads/images/1234567890-my-file.jpg',
    description: 'S3 key/path where the file will be stored',
  })
  key: string;

  @ApiProperty({
    example: 600,
    description: 'Expiration time in seconds',
  })
  expiresIn: number;

  @ApiProperty({
    example: '2025-07-23T11:30:00Z',
    description: 'When the presigned URL expires',
  })
  expiresAt: string;
}
