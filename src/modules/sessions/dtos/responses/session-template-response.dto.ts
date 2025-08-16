// src/modules/sessions/dtos/responses/session-template-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { SessionTemplate } from '../../schemas/session-template.schema';

export class OutputFieldResponseDto {
  @ApiProperty({ example: 1 })
  id: number | string;

  @ApiProperty({ example: 'Patient Name' })
  label: string;

  @ApiProperty({ example: 'John Doe' })
  value: string;

  @ApiProperty({ example: 'Enter the patient full name' })
  guide: string;

  @ApiProperty({ example: 'John Smith' })
  sample: string;

  @ApiProperty({ example: 1 })
  order: number;
}

export class SessionTemplateResponseDto {
  @ApiProperty({ example: '507f191e810c19729de860ea' })
  _id: string;

  @ApiProperty({ enum: LanguageEnum, example: LanguageEnum.EN_US })
  language: LanguageEnum;

  @ApiProperty({ type: [OutputFieldResponseDto] })
  fields: OutputFieldResponseDto[];

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  updatedAt: Date;
}

export function fromSessionTemplateToResponseDto(
  template: SessionTemplate,
): SessionTemplateResponseDto {
  const responseDto = new SessionTemplateResponseDto();
  responseDto._id = template._id.toString();
  responseDto.language = template.language;
  responseDto.fields = template.fields.map((field) => {
    const result: OutputFieldResponseDto = {
      id: field.id,
      label: field.label,
      value: field.value,
      guide: field.guide,
      sample: field.sample,
      order: field.order,
    };
    return result;
  });
  responseDto.createdAt = template.createdAt;
  responseDto.updatedAt = template.updatedAt;
  return responseDto;
}
