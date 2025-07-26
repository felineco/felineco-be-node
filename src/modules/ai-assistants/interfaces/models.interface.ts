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
  images: UploadedImage[];
  audios: UploadedAudio[];
  noteFields: OutputField[];
  reminderFields: OutputField[];
  warningFields: OutputField[];
}
