// src/modules/sessions/controllers/sessions.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { MongoIdPathParamDto } from 'src/common/dtos/mongo-id-path-param.dto';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { CreateSessionTemplateDto } from '../dtos/requests/create-session-template.dto';
import { GetSessionTemplatesDto } from '../dtos/requests/get-session-templates.dto';
import { UpdateSessionTemplateDto } from '../dtos/requests/update-session-template.dto';
import {
  fromSessionTemplateToResponseDto,
  SessionTemplateResponseDto,
} from '../dtos/responses/session-template-response.dto';
import { DbOutputField } from '../schemas/db-output-field.schema';
import { SessionsService } from '../services/sessions.service';

@ApiTags('Sessions Templates')
@Auth({ privilege: Privilege.SESSION_TEMPLATE, operation: Operation.MANAGE })
@Controller('sessions/templates')
export class SessionTemplatesController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async createTemplate(
    @Body() createSessionTemplateDto: CreateSessionTemplateDto,
  ): Promise<SessionTemplateResponseDto> {
    // Map from dto to schema
    const fields: DbOutputField[] = createSessionTemplateDto.fields.map(
      (field) => {
        const result: DbOutputField = {
          id: field.id,
          label: field.label,
          value: field.value,
          guide: field.guide,
          sample: field.sample,
          order: field.order,
        };
        return result;
      },
    );

    const template = await this.sessionsService.createTemplate({
      language: createSessionTemplateDto.language,
      fields,
    });
    return fromSessionTemplateToResponseDto(template);
  }

  @Get()
  async getAllTemplates(
    @Query() query: GetSessionTemplatesDto,
  ): Promise<SessionTemplateResponseDto[]> {
    const templates = await this.sessionsService.findAllTemplates(
      query.language,
    );
    return templates.map((template) =>
      fromSessionTemplateToResponseDto(template),
    );
  }

  @Get(':id')
  async getTemplateById(
    @Param() params: MongoIdPathParamDto,
  ): Promise<SessionTemplateResponseDto> {
    const template = await this.sessionsService.findTemplateById(params.id);
    return fromSessionTemplateToResponseDto(template);
  }

  @Patch(':id')
  async updateTemplate(
    @Param() params: MongoIdPathParamDto,
    @Body() updateSessionTemplateDto: UpdateSessionTemplateDto,
  ): Promise<SessionTemplateResponseDto> {
    // Map from dto to schema
    const fields: DbOutputField[] | undefined =
      updateSessionTemplateDto.fields?.map((field) => {
        const result: DbOutputField = {
          id: field.id,
          label: field.label,
          value: field.value,
          guide: field.guide,
          sample: field.sample,
          order: field.order,
        };
        return result;
      });

    const template = await this.sessionsService.updateTemplate(params.id, {
      language: updateSessionTemplateDto.language,
      fields,
    });
    return fromSessionTemplateToResponseDto(template);
  }

  @Delete(':id')
  async deleteTemplate(
    @Param() params: MongoIdPathParamDto,
  ): Promise<{ message: string }> {
    await this.sessionsService.deleteTemplate(params.id);
    return { message: 'Template deleted successfully' };
  }
}
