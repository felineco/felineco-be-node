// src/modules/permissions/schemas/permission.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Action, Privilege } from 'src/common/enums/permission.enum';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({
  timestamps: true,
  collection: TABLE_NAME.PERMISSION,
})
export class Permission {
  _id: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(Privilege),
  })
  privilege: Privilege;

  @Prop({
    required: true,
    enum: Object.values(Action),
  })
  action: Action;

  createdAt: Date;
  updatedAt: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Create a compound unique index to prevent duplicate privilege+action combinations
PermissionSchema.index({ privilege: 1, action: 1 }, { unique: true });
