// src/modules/seeding/seeding.service.ts
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { AppLoggerService } from 'src/common/services/logger.service';
import { PermissionsService } from '../permissions/services/permissions.service';
import { RolesService } from '../roles/services/roles.service';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class SeedingService implements OnApplicationBootstrap {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SeedingService.name);
  }

  async onApplicationBootstrap() {
    await this.seedDatabase();
  }

  private async seedDatabase() {
    this.logger.log('Starting database seeding...');
    try {
      await this.createAdminUser();
    } catch {
      this.logger.error('Database seeding failed');
      // Don't throw error to prevent app from crashing
    }
    this.logger.log('Database seeding completed');
  }

  private async createAdminUser(): Promise<void> {
    const adminEmail =
      this.configService.get<string>('auth.adminUser.email') ??
      'admin@gmail.com';
    const adminPassword =
      this.configService.get<string>('auth.adminUser.password') ?? 'admin123';

    // 1. Create permissions
    // Create of all privilege
    const manageOperation = Operation.MANAGE;
    const privilegeIds = await Promise.all(
      Object.values(Privilege).map((privilege) =>
        this.permissionsService.createPermissionsIfNotExist({
          privilege,
          operation: manageOperation,
        }),
      ),
    );

    // 2. Create admin role with all permissions
    const adminRoleId = await this.rolesService.createRoleIfNotExist({
      roleName: 'Admin',
    });
    await this.rolesService.addPermissions(adminRoleId, privilegeIds);

    // 3. Create admin user
    let adminUserId: string;
    try {
      adminUserId = (
        await this.usersService.findByEmail(adminEmail)
      )._id.toString();
    } catch {
      adminUserId = (
        await this.usersService.create({
          email: adminEmail,
          password: adminPassword,
        })
      )._id.toString();
    }
    await this.usersService.addRoles(adminUserId, [adminRoleId]);

    this.logger.log(
      `Admin user created: ID - ${adminUserId}, email - ${adminEmail}`,
    );
  }
}
