// src/modules/roles/roles.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesController } from './controllers/roles.controller';
import { Role, RoleSchema } from './schemas/role.schema';
import { RolesService } from './services/roles.service';

const RoleMongooseModule = MongooseModule.forFeature([
  { name: Role.name, schema: RoleSchema },
]);

@Module({
  imports: [RoleMongooseModule, PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, RoleMongooseModule],
})
export class RolesModule {}
