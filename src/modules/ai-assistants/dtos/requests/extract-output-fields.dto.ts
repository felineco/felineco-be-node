// src/modules/ai-assistants/dtos/requests/extract-output-fields.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUrl } from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

export class ExtractOutputFieldsDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.png',
    ],
    description: 'List of image URLs to extract output fields from',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @IsUrl({}, { each: true })
  imageUrls: string[];
}
