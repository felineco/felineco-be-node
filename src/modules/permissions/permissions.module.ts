// src/modules/permissions/permissions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsController } from './controllers/permissions.controller';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { PermissionsService } from './services/permissions.service';

const PermissionMongooseModule = MongooseModule.forFeature([
  { name: Permission.name, schema: PermissionSchema },
]);

@Module({
  imports: [PermissionMongooseModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService, PermissionMongooseModule],
})
export class PermissionsModule {}
