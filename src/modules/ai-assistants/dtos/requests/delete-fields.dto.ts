// src/modules/ai-assistants/dtos/requests/delete-fields.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

class DeleteFieldDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the field to delete',
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;
}

export class DeleteFieldsDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    type: [DeleteFieldDto],
    description: 'Array of fields to delete',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteFieldDto)
  fields: DeleteFieldDto[];
}
