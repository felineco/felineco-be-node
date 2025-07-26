// src/modules/grpc-clients/services/transcription-service.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientGrpc,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';
import {
  TranscribeAudioRequest,
  TranscribeAudioResponse,
  TranscriptionService,
} from '../interfaces/transcription.interface';

import { GrpcMetadataService } from './grpc-metadata.service';

@Injectable()
export class GRPCTranscriptionService implements OnModuleInit {
  private client: ClientGrpc;
  private transcriptionService: TranscriptionService;

  constructor(
    private configService: ConfigService,
    private grpcMetadataService: GrpcMetadataService,
  ) {}

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'transcription',
        protoPath: join(
          __dirname,
          '../proto/transcription/transcription.proto',
        ),
        url: this.configService.get<string>('grpc.url') ?? 'localhost:50051',
      },
    }) as ClientGrpc;

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
