// src/modules/roles/schemas/role.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import { Permission } from 'src/modules/permissions/schemas/permission.schema';

export type RoleDocument = HydratedDocument<Role>;

@Schema({
  timestamps: true,
  collection: TABLE_NAME.ROLE,
})
export class Role {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  roleName: string;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: Permission.name,
    default: [],
  })
  permissions: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

export type RoleWWithPopulatePermission = Omit<Role, 'permissions'> & {
  permissions: Permission[];
};
