// src/modules/sessions/schemas/db-output-field.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false })
export class DbOutputField {
  @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
  id: number | string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: false, default: '' })
  value: string;

  @Prop({ required: false, default: '' })
  guide: string;

  @Prop({ required: false, default: '' })
  sample: string;

  @Prop({ required: true })
  order: number;
}

export const DbOutputFieldSchema = SchemaFactory.createForClass(DbOutputField);
