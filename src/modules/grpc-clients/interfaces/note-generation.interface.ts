// src/modules/grpc-clients/interfaces/note-generation.interface.ts
import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export interface GenerateNotesRequestItem {
  id: number;
  label: string;
  guide: string;
  sample: string;
}

export interface GenerateNotesRequest {
  note_fields: GenerateNotesRequestItem[];
  image_urls: string[];
  audio_transcriptions: string[];
  prompt: string;
  language: string;
}

export interface GenerateNotesResponseItem {
  id: number;
  label: string;
  value: string;
}

export interface GenerateNotesResponse {
  note_fields: GenerateNotesResponseItem[];
  reminder_fields: GenerateNotesResponseItem[];
  warning_fields: GenerateNotesResponseItem[];
}

export interface ExtractOutputFieldsRequest {
  image_urls: string[];
  prompt: string;
  language: string;
}

export interface ExtractOutputFieldsResponseItem {
  label: string;
  guide: string;
}

export interface ExtractOutputFieldsResponse {
  output_fields: ExtractOutputFieldsResponseItem[];
}

export interface NoteGenerationService {
  generateNotes(
    request: GenerateNotesRequest,
    metadata?: Metadata,
  ): Observable<GenerateNotesResponse>;
  extractOutputFields(
    request: ExtractOutputFieldsRequest,
    metadata?: Metadata,
  ): Observable<ExtractOutputFieldsResponse>;
}
