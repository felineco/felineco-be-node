// src/modules/sessions/dtos/requests/create-session-template.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { OutputFieldDto } from './output-field.dto';

export class CreateSessionTemplateDto {
  @ApiProperty({
    enum: LanguageEnum,
    example: LanguageEnum.EN_US,
    description: 'Language for the template',
  })
  @IsEnum(LanguageEnum)
  @IsNotEmpty()
  language: LanguageEnum;

  @ApiProperty({
    type: [OutputFieldDto],
    description: 'Array of output fields for the template',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutputFieldDto)
  fields: OutputFieldDto[];
}
