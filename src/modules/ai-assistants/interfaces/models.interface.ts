// src/modules/ai-assistants/interfaces/models.ts

export interface UploadedImage {
  id: string;
  url: string;
}

export interface UploadedAudio {
  id: string;
  url: string;
}

export interface OutputField {
  id: number;
  label: string;
  value: string;
  guide: string;
  sample: string;
}

export interface UserModel {
  images: Map<string, UploadedImage>;
  audios: Map<string, UploadedAudio>;
  noteFields: Map<number, OutputField>;
  reminderFields: Map<number, OutputField>;
  warningFields: Map<number, OutputField>;
}
