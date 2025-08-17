// src/modules/grpc-clients/services/note-generation-service.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import {
  ExtractOutputFieldsRequest,
  ExtractOutputFieldsResponse,
  GenerateNotesRequest,
  GenerateNotesResponse,
  NoteGenerationService,
} from '../interfaces/note-generation.interface';
import { GrpcClientFactory } from './grpc-client-factory.service';
import { GrpcMetadataService } from './grpc-metadata.service';

@Injectable()
export class GRPCNoteGenerationService implements OnModuleInit {
  private client: ClientGrpc;
  private noteGenerationService: NoteGenerationService;

  constructor(
    private configService: ConfigService,
    private grpcMetadataService: GrpcMetadataService,
    private grpcClientFactory: GrpcClientFactory,
  ) {}

  onModuleInit() {
    this.client = this.grpcClientFactory.createClient(
      'note_generation',
      '../proto/note_generation/note_generation.proto',
    );

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
