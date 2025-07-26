// src/modules/grpc-clients/services/note-generation-service.service.ts
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
  ExtractOutputFieldsRequest,
  ExtractOutputFieldsResponse,
  GenerateNotesRequest,
  GenerateNotesResponse,
  NoteGenerationService,
} from '../interfaces/note-generation.interface';
import { GrpcMetadataService } from './grpc-metadata.service';

@Injectable()
export class GRPCNoteGenerationService implements OnModuleInit {
  private client: ClientGrpc;
  private noteGenerationService: NoteGenerationService;

  constructor(
    private configService: ConfigService,
    private grpcMetadataService: GrpcMetadataService,
  ) {}

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'note_generation',
        protoPath: join(
          __dirname,
          '../proto/note_generation/note_generation.proto',
        ),
        url: this.configService.get<string>('grpc.url') ?? 'localhost:50051',
      },
    }) as ClientGrpc;

    this.noteGenerationService = this.client.getService<NoteGenerationService>(
      'NoteGenerationService',
    );
  }

  generateNotes(
    request: GenerateNotesRequest,
  ): Observable<GenerateNotesResponse> {
    return this.noteGenerationService.generateNotes(
      request,
      this.grpcMetadataService.metaDataWithApiKey(),
    );
  }

  extractOutputFields(
    request: ExtractOutputFieldsRequest,
  ): Observable<ExtractOutputFieldsResponse> {
    return this.noteGenerationService.extractOutputFields(
      request,
      this.grpcMetadataService.metaDataWithApiKey(),
    );
  }
}
