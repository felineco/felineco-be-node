// src/modules/auth/dtos/update-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { LanguageEnum } from 'src/common/enums/language.enum';

export class UpdateProfileDto {
  @ApiProperty({
    enum: LanguageEnum,
    example: LanguageEnum.EN_US,
    description: 'User preferred language',
    required: false,
  })
  @IsEnum(LanguageEnum)
  @IsOptional()
  language?: LanguageEnum;
}
