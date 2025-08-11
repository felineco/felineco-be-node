// src/modules/ai-assistants/dtos/requests/update-fields.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

class OutputFieldDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the field',
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    example: 'Patient Name',
    description: 'Label of the field',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Value of the field',
  })
  @IsString()
  value: string;

  @ApiProperty({
    example: 'Enter the patient full name',
    description: 'Guide text for the field',
  })
  @IsString()
  guide: string;

  @ApiProperty({
    example: 'John Smith',
    description: 'Sample value for the field',
  })
  @IsString()
  sample: string;

  @ApiProperty({
    example: 1,
    description: 'Order of the field',
  })
  @IsNumber()
  @IsNotEmpty()
  order: number;
}

export class UpdateFieldsDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    type: [OutputFieldDto],
    description: 'Array of fields to update',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutputFieldDto)
  fields: OutputFieldDto[];
}
