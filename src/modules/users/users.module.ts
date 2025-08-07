// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
// import { UsersController } from './controllers/users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './services/users.service';

const UserMongooseModule = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);

@Module({
  imports: [UserMongooseModule, RolesModule, PermissionsModule],
  controllers: [
    // UsersController
  ],
  providers: [UsersService],
  exports: [
    UsersService,
    // UserMongooseModule, // Exporting the User model for use in other modules
  ],
})
export class UsersModule {}
