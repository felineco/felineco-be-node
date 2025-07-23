// src/modules/s3/dtos/requests/generate-presigned-url.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FileType } from '../../enum/file-type.enum';

export class GeneratePresignedUrlDto {
  @ApiProperty({
    enum: FileType,
    example: FileType.IMAGE,
    description: 'Type of file to upload',
  })
  @IsEnum(FileType)
  @IsNotEmpty()
  type: FileType;

  @ApiProperty({
    example: 'my-file.jpg',
    description: 'Original filename (optional, used for generating unique key)',
    required: false,
  })
  @IsString()
  @IsOptional()
  filename?: string;
}
