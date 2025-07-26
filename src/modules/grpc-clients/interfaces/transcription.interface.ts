// src/modules/grpc-clients/interfaces/transcription.interface.ts
import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export interface TranscribeAudioRequest {
  audio_urls: string[];
  instruction: string;
  language: string;
}

export interface TranscribeAudioResponse {
  audio_transcriptions: string[];
}

export interface TranscriptionService {
  transcribeAudio(
    request: TranscribeAudioRequest,
    metadata?: Metadata,
  ): Observable<TranscribeAudioResponse>;
}
