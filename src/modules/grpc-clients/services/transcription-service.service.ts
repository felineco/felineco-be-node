// src/modules/grpc-clients/services/transcription-service.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  TranscribeAudioRequest,
  TranscribeAudioResponse,
  TranscriptionService,
} from '../interfaces/transcription.interface';

import { GrpcClientFactory } from './grpc-client-factory.service';
import { GrpcMetadataService } from './grpc-metadata.service';

@Injectable()
export class GRPCTranscriptionService implements OnModuleInit {
  private client: ClientGrpc;
  private transcriptionService: TranscriptionService;

  constructor(
    private configService: ConfigService,
    private grpcMetadataService: GrpcMetadataService,
    private grpcClientFactory: GrpcClientFactory,
  ) {}

  onModuleInit() {
    this.client = this.grpcClientFactory.createClient(
      'transcription',
      '../proto/transcription/transcription.proto',
    );
    this.transcriptionService = this.client.getService<TranscriptionService>(
      'TranscriptionService',
    );
  }

  transcribeAudio(
    request: TranscribeAudioRequest,
  ): Observable<TranscribeAudioResponse> {
    return this.transcriptionService.transcribeAudio(
      request,
      this.grpcMetadataService.metaDataWithApiKey(),
    );
  }
}
