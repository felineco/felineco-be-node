// src/modules/s3/services/s3.service.ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileType } from '../enum/file-type.enum';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly presignedUrlExpiration: number;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('s3.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId') ?? '',
        secretAccessKey:
          this.configService.get<string>('s3.secretAccessKey') ?? '',
      },
    });

    this.bucket = this.configService.get<string>('s3.bucket') ?? '';
    this.presignedUrlExpiration =
      this.configService.get<number>('s3.presignedUrlExpiration') ?? 600;
  }

  async generatePresignedUrl(
    type: FileType,
    filename?: string,
  ): Promise<{
    presignedUrl: string;
    key: string;
    expiresIn: number;
    expiresAt: string;
  }> {
    const key = this.generateS3Key(type, filename);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.presignedUrlExpiration,
    });

    const expiresAt = new Date(Date.now() + this.presignedUrlExpiration * 1000);

    return {
      presignedUrl,
      key,
      expiresIn: this.presignedUrlExpiration,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private generateS3Key(type: FileType, filename?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    const folder = type === FileType.IMAGE ? 'images' : 'audios';
    const extension =
      this.getFileExtension(filename) || this.getDefaultExtension(type);

    return `${folder}/${timestamp}-${randomString}${extension}`;
  }

  private getFileExtension(filename?: string): string {
    if (filename === undefined) return '';
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : '';
  }

  private getDefaultExtension(type: FileType): string {
    return type === FileType.IMAGE ? '.jpg' : '.mp3';
  }
}
