// src/modules/sessions/dtos/requests/get-session-templates.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LanguageEnum } from 'src/common/enums/language.enum';

export class GetSessionTemplatesDto {
  @ApiProperty({
    enum: LanguageEnum,
    isArray: true,
    example: [LanguageEnum.EN_US, LanguageEnum.VI_VN],
    description: 'Languages to filter templates by',
    required: false,
  })
  @IsOptional()
  // @IsArray() // Removed as it can be 1 language
  @IsEnum(LanguageEnum, { each: true })
  language?: LanguageEnum[];
}
