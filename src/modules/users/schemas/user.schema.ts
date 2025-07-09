// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import mongoose, { HydratedDocument } from 'mongoose';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import {
  Role,
  RoleWWithPopulatePermission,
} from 'src/modules/roles/schemas/role.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: TABLE_NAME.USER,
})
export class User {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  @Exclude()
  hashPassword: string;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: Role.name,
    default: [],
  })
  roles: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserWithPopulateRoleAndPermission = Omit<User, 'roles'> & {
  roles: RoleWWithPopulatePermission[];
};
