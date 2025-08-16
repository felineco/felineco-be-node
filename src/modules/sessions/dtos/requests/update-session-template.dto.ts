// src/modules/sessions/dtos/requests/update-session-template.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { OutputFieldDto } from './output-field.dto';

export class UpdateSessionTemplateDto {
  @ApiProperty({
    enum: LanguageEnum,
    example: LanguageEnum.EN_US,
    description: 'Language for the template',
    required: false,
  })
  @IsEnum(LanguageEnum)
  @IsOptional()
  language?: LanguageEnum;

  @ApiProperty({
    type: [OutputFieldDto],
    description: 'Array of output fields for the template',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutputFieldDto)
  @IsOptional()
  fields?: OutputFieldDto[];
}
