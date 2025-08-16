// src/modules/sessions/services/sessions.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { DbOutputField } from '../schemas/db-output-field.schema';
import {
  SessionTemplate,
  SessionTemplateDocument,
} from '../schemas/session-template.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(SessionTemplate.name)
    private sessionTemplateModel: Model<SessionTemplateDocument>,
  ) {}

  async createTemplate(templateData: {
    language: LanguageEnum;
    fields: DbOutputField[];
  }): Promise<SessionTemplate> {
    const template = new this.sessionTemplateModel(templateData);
    return await template.save();
  }

  async findAllTemplates(
    language?: LanguageEnum[],
  ): Promise<SessionTemplate[]> {
    const filter =
      language && language.length ? { language: { $in: language } } : {};
    return await this.sessionTemplateModel.find(filter).exec();
  }

  async findTemplateById(id: string): Promise<SessionTemplate> {
    const template = await this.sessionTemplateModel.findById(id).exec();

    if (!template) {
      throw new BadRequestException(`Template with ID '${id}' not found`);
    }

    return template;
  }

  async updateTemplate(
    id: string,
    updateData: Partial<SessionTemplate>,
  ): Promise<SessionTemplate> {
    const updatedTemplate = await this.sessionTemplateModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedTemplate) {
      throw new BadRequestException(`Template with ID '${id}' not found`);
    }

    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const result = await this.sessionTemplateModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new BadRequestException(`Template with ID '${id}' not found`);
    }
  }
}
