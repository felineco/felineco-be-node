// src/modules/ai-assistants/dtos/requests/delete-images.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

class DeleteImageDto {
  @ApiProperty({
    example: 'img-123',
    description: 'Unique identifier for the image to delete',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class DeleteImagesDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    type: [DeleteImageDto],
    description: 'Array of images to delete',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteImageDto)
  images: DeleteImageDto[];
}
