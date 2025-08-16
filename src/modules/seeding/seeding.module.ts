// src/modules/seeding/seeding.module.ts
import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';
import { SeedingService } from './seeding.service';

@Module({
  imports: [PermissionsModule, RolesModule, UsersModule],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}
