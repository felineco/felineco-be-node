// src/modules/ai-assistants/dtos/responses/ws-initialize.dto.ts

import {
  OutputField,
  UploadedAudio,
  UploadedImage,
} from '../../interfaces/models.interface';

export class WsInitializeDto {
  images: UploadedImage[];
  audios: UploadedAudio[];
  noteFields: OutputField[];
  reminderFields: OutputField[];
  warningFields: OutputField[];
}
