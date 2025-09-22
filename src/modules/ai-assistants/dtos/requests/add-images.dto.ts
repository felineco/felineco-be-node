// src/modules/ai-assistants/dtos/requests/add-images.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

class UploadedImageDto {
  @ApiProperty({
    example: 'img-123',
    description: 'Unique identifier for the image',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL of the uploaded image',
  })
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  url: string;
}

export class AddImagesDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    type: [UploadedImageDto],
    description: 'Array of images to add',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedImageDto)
  images: UploadedImageDto[];
}
