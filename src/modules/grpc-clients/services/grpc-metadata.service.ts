// src/common/services/grpc-metadata.service.ts
import { Metadata } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrpcMetadata } from '../constants/grpc-metadata';

@Injectable()
export class GrpcMetadataService {
  private apiKeyMetadata: string;
  constructor(private configService: ConfigService) {
    // Initialize the API key from the configuration
    this.apiKeyMetadata = this.configService.get<string>('grpc.apiKey') ?? '';

    if (this.apiKeyMetadata === '') {
      throw new Error('API key for gRPC metadata is not configured.');
    }
  }

  metaDataWithApiKey(): Metadata {
    const metadata = new Metadata();
    metadata.add(GrpcMetadata.API_KEY, this.apiKeyMetadata);
    return metadata;
  }
}
