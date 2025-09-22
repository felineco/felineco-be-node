// src/modules/ai-assistants/dtos/requests/add-audios.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

class UploadedAudioDto {
  @ApiProperty({
    example: 'audio-123',
    description: 'Unique identifier for the audio',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'https://example.com/audio.mp3',
    description: 'URL of the uploaded audio',
  })
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: 120,
    description: 'Duration of the audio in seconds',
  })
  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class AddAudiosDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    type: [UploadedAudioDto],
    description: 'Array of audios to add',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedAudioDto)
  audios: UploadedAudioDto[];
}
