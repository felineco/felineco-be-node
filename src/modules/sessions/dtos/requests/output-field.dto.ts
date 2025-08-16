// src/modules/sessions/dtos/requests/output-field.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class OutputFieldDto {
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
    required: false,
  })
  @IsString()
  value: string;

  @ApiProperty({
    example: 'Enter the patient full name',
    description: 'Guide text for the field',
    required: false,
  })
  @IsString()
  guide: string;

  @ApiProperty({
    example: 'John Smith',
    description: 'Sample value for the field',
    required: false,
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
