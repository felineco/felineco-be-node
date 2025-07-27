// src/modules/ai-assistants/dtos/requests/delete-audios.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

class DeleteAudioDto {
  @ApiProperty({
    example: 'audio-123',
    description: 'Unique identifier for the audio to delete',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class DeleteAudiosDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    type: [DeleteAudioDto],
    description: 'Array of audios to delete',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteAudioDto)
  audios: DeleteAudioDto[];
}
