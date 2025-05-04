// src/modules/roles/services/roles.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import {
  PagingQueryOptions,
  toTypeOrmSortOrder,
} from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponse,
  PagingResponseMeta,
} from '../../../common/dtos/page-response.dto';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';
import { Permission } from 'src/modules/permissions/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(roleData: {
    roleName: string;
    permissionIds?: string[];
  }): Promise<Role> {
    // Check if role with the same name already exists
    const existingRole = await this.rolesRepository.findOne({
      where: {
        roleName: roleData.roleName,
      },
    });

    if (existingRole) {
      throw new BadRequestException(
        `Role with name '${roleData.roleName}' already exists`,
      );
    }

    const role = this.rolesRepository.create({
      roleName: roleData.roleName,
    });

    // If permission IDs are provided, fetch and assign them
    if (roleData.permissionIds && roleData.permissionIds.length > 0) {
      const permissions = await this.permissionsRepository.find({
        where: { id: In(roleData.permissionIds) },
      });

      const foundIdsSet = new Set(permissions.map((p) => p.id));
      const notFoundIds = roleData.permissionIds.filter(
        (id) => !foundIdsSet.has(id),
      );

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Some permission IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }

      role.permissions = permissions;
    }
    return await this.rolesRepository.save(role);
  }

  async findAll(
    pageOptions: PagingQueryOptions,
  ): Promise<PagingResponse<Role>> {
    const queryBuilder = this.rolesRepository.createQueryBuilder(
      TABLE_NAME.ROLE,
    );

    // Explicitly join and select the permissions
    queryBuilder.leftJoinAndSelect(
      `${TABLE_NAME.ROLE}.permissions`,
      'permissions',
    );

    const [sortField, sortOrder] = pageOptions.sortParams;
    queryBuilder
      .orderBy(`${TABLE_NAME.ROLE}.${sortField}`, toTypeOrmSortOrder(sortOrder))
      .skip(pageOptions.skip)
      .take(pageOptions.limit);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PagingResponseMeta({
      page: pageOptions.page,
      limit: pageOptions.limit,
      itemCount,
    });

    return new PagingResponse(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new BadRequestException(`Role with ID '${id}' not found`);
    }

    return role;
  }

  async update(
    id: string,
    roleData: DeepPartial<Role>,
    permissionIds?: string[],
  ): Promise<Role> {
    const role = await this.findOne(id);

    // Update basic role properties
    if (roleData.roleName && roleData.roleName !== role.roleName) {
      const existingRole = await this.rolesRepository.findOne({
        where: { roleName: roleData.roleName },
      });

      if (existingRole && existingRole.id !== id) {
        throw new BadRequestException(
          `Role with name '${roleData.roleName}' already exists`,
        );
      }
    }

    // Update role's basic properties
    const updatedRole = this.rolesRepository.merge(role, roleData);

    // If permission IDs are provided, update permissions
    if (permissionIds) {
      const permissions = await this.permissionsRepository.find({
        where: { id: In(permissionIds) },
      });

      const foundIdsSet = new Set(permissions.map((p) => p.id));
      const notFoundIds = permissionIds.filter((id) => !foundIdsSet.has(id));

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Some permission IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }

      updatedRole.permissions = permissions;
    }

    return await this.rolesRepository.save(updatedRole);
  }

  async remove(id: string): Promise<void> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true, users: true },
    });

    if (!role) {
      throw new BadRequestException(`Role with ID '${id}' not found`);
    }

    // Clear both the permissions and users relationships
    role.permissions = [];
    role.users = [];

    // Save to clear the join tables first
    await this.rolesRepository.save(role);

    // Then remove the role
    await this.rolesRepository.remove(role);
  }

  async addPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findOne(roleId);
    const newPermissions = await this.permissionsRepository.find({
      where: { id: In(permissionIds) },
    });

    const foundIdsSet = new Set(newPermissions.map((p) => p.id));
    if (newPermissions.length !== permissionIds.length) {
      const notFoundIds = permissionIds.filter((id) => !foundIdsSet.has(id));

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Some permission IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }
    }

    // Keep existing permissions that aren't in the new set
    const existingPermissions = role.permissions.filter(
      (p) => !foundIdsSet.has(p.id),
    );

    // Combine existing permissions with new ones
    role.permissions = [...existingPermissions, ...newPermissions];
    return await this.rolesRepository.save(role);
  }

  async removePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findOne(roleId);

    const excludePermissionSet = new Set(permissionIds);

    // Filter out the permissions to be removed
    role.permissions = role.permissions.filter(
      (permission) => !excludePermissionSet.has(permission.id),
    );

    return await this.rolesRepository.save(role);
  }
}
