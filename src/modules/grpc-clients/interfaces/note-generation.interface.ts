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
  noteFields: GenerateNotesRequestItem[];
  imageUrls: string[];
  audioTranscriptions: string[];
  prompt: string;
  language: string;
}

export interface GenerateNotesResponseItem {
  id: number;
  label: string;
  value: string;
}

export interface GenerateNotesResponse {
  noteFields: GenerateNotesResponseItem[];
  reminderFields: GenerateNotesResponseItem[];
  warningFields: GenerateNotesResponseItem[];
}

export interface ExtractOutputFieldsRequest {
  imageUrls: string[];
  prompt: string;
  language: string;
}

export interface ExtractOutputFieldsResponseItem {
  label: string;
  guide: string;
}

export interface ExtractOutputFieldsResponse {
  outputFields: ExtractOutputFieldsResponseItem[];
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
