// src/modules/ai-assistants/interfaces/models.ts

import { LanguageEnum } from 'src/common/enums/language.enum';

export interface UploadedImage {
  id: string;
  url: string;
  aiAnalysis: string;
}

export interface UploadedAudio {
  id: string;
  url: string;
  duration?: number; // Duration in seconds
  transcription: string;
}

export interface OngoingAudioTranscription {
  id: string;
  currentFullTranscription: string;
  currentFullTranscriptionFromLargeChunks: string;
  transcriptionQueueKey: string; // Id of the rabbitmq consumer that processes audio chunks for this transcription
}

export interface OutputField {
  id: number;
  label: string;
  value: string;
  guide: string;
  sample: string;
  order: number;
}

export interface ImageAnalysis {
  description: string;
}

export interface UserModel {
  images: Map<string, UploadedImage>;
  audios: Map<string, UploadedAudio>;
  ongoingTranscriptions: Map<string, OngoingAudioTranscription>; // Current transcriptions being processed
  noteFields: Map<number, OutputField>;
  reminderFields: Map<number, OutputField>;
  warningFields: Map<number, OutputField>;
  analysisTriggerConsumerTag: string;
  isAIThinkingQueue: Array<string>; // Queue to indicate AI is thinking to signal the front end
  language: LanguageEnum;
}
