// src/modules/grpc/grpc.module.ts
import { Module } from '@nestjs/common';
import { GrpcMetadataService } from './services/grpc-metadata.service';
import { GRPCHealthService } from './services/health-service.service';
import { GRPCNoteGenerationService } from './services/note-generation-service.service';
import { GRPCTranscriptionService } from './services/transcription-service.service';

@Module({
  imports: [],
  providers: [
    GrpcMetadataService,
    GRPCHealthService,
    GRPCNoteGenerationService,
    GRPCTranscriptionService,
  ],
  exports: [
    GrpcMetadataService,
    GRPCHealthService,
    GRPCNoteGenerationService,
    GRPCTranscriptionService,
  ],
})
export class GrpcModule {}
