// src/modules/sessions/schemas/session-template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import { DbOutputField } from './db-output-field.schema';

export type SessionTemplateDocument = HydratedDocument<SessionTemplate>;

@Schema({
  timestamps: true,
  collection: TABLE_NAME.SESSION_TEMPLATE,
})
export class SessionTemplate {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(LanguageEnum) })
  language: LanguageEnum;

  @Prop({ required: true, type: [DbOutputField] })
  fields: DbOutputField[];

  createdAt: Date;
  updatedAt: Date;
}

export const SessionTemplateSchema =
  SchemaFactory.createForClass(SessionTemplate);

// Create compound index for efficient queries
SessionTemplateSchema.index({ language: 1 });
