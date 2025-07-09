// src/modules/roles/services/roles.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  Permission,
  PermissionDocument,
} from 'src/modules/permissions/schemas/permission.schema';
import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponse,
  PagingResponseMeta,
} from '../../../common/dtos/page-response.dto';
import {
  Role,
  RoleDocument,
  RoleWWithPopulatePermission,
} from '../schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(roleData: {
    roleName: string;
    permissionIds?: string[];
  }): Promise<Role> {
    // Check if role with the same name already exists
    const existingRole = await this.roleModel
      .findOne({
        roleName: roleData.roleName,
      })
      .exec();

    if (existingRole) {
      throw new BadRequestException(
        `Role with name '${roleData.roleName}' already exists`,
      );
    }

    // Validate permission IDs if provided
    if (roleData.permissionIds && roleData.permissionIds.length > 0) {
      const permissions = await this.permissionModel
        .find({ _id: { $in: roleData.permissionIds } })
        .exec();

      if (permissions.length !== roleData.permissionIds.length) {
        const foundIds = permissions.map((p) => p._id.toString());
        const notFoundIds = roleData.permissionIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new BadRequestException(
          `Some permission IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }
    }

    const role = new this.roleModel({
      roleName: roleData.roleName,
      permissions: roleData.permissionIds ?? [],
    });

    return await role.save();
  }

  async findAll(
    pageOptions: PagingQueryOptions,
  ): Promise<PagingResponse<RoleWWithPopulatePermission>> {
    const [sortField, sortOrder] = pageOptions.mongoSortParams;

    const [roles, itemCount] = await Promise.all([
      this.roleModel
        .find()
        .populate<{ permissions: Permission[] }>('permissions')
        .sort({ [sortField]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.roleModel.countDocuments().exec(),
    ]);

    const pageMetaDto = new PagingResponseMeta({
      page: pageOptions.page,
      limit: pageOptions.limit,
      itemCount,
    });

    return new PagingResponse(roles, pageMetaDto);
  }

  async findOne(id: string): Promise<RoleWWithPopulatePermission> {
    const role = await this.roleModel
      .findById(id)
      .populate<{ permissions: Permission[] }>('permissions')
      .exec();

    if (!role) {
      throw new BadRequestException(`Role with ID '${id}' not found`);
    }

    return role;
  }

  async update(
    id: string,
    roleData: Partial<Role>,
    permissionIds?: string[],
  ): Promise<RoleWWithPopulatePermission> {
    const role = await this.roleModel.findById(id).exec();

    if (!role) {
      throw new BadRequestException(`Role with ID '${id}' not found`);
    }

    // Check for duplicate role name if updating
    if (
      (roleData.roleName ?? '') !== '' &&
      roleData.roleName !== role.roleName
    ) {
      const existingRole = await this.roleModel
        .findOne({
          roleName: roleData.roleName,
          _id: { $ne: id },
        })
        .exec();

      if (existingRole) {
        throw new BadRequestException(
          `Role with name '${roleData.roleName}' already exists`,
        );
      }
    }

    // Validate permission IDs if provided
    if (permissionIds) {
      const permissions = await this.permissionModel
        .find({ _id: { $in: permissionIds } })
        .exec();

      if (permissions.length !== permissionIds.length) {
        const foundIds = permissions.map((p) => p._id.toString());
        const notFoundIds = permissionIds.filter(
          (id) => !foundIds.includes(id),
        );
        throw new BadRequestException(
          `Some permission IDs were not found: ${notFoundIds.join(', ')}`,
        );
      }

      roleData.permissions = permissionIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );
    }

    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, roleData, { new: true })
      .populate<{ permissions: Permission[] }>('permissions')
      .exec();

    if (!updatedRole) {
      throw new BadRequestException(`Role with ID '${id}' not found`);
    }

    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new BadRequestException(`Role with ID '${id}' not found`);
    }
  }

  async addPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleWWithPopulatePermission> {
    const role = await this.roleModel.findById(roleId).exec();

    if (!role) {
      throw new BadRequestException(`Role with ID '${roleId}' not found`);
    }

    // Validate permission IDs
    const permissions = await this.permissionModel
      .find({ _id: { $in: permissionIds } })
      .exec();

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map((p) => p._id.toString());
      const notFoundIds = permissionIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Some permission IDs were not found: ${notFoundIds.join(', ')}`,
      );
    }

    // Add new permissions (avoiding duplicates)
    const currentPermissionIds = role.permissions.map(
      (p: mongoose.Types.ObjectId) => {
        return p.toString();
      },
    );

    const newPermissionIds = permissionIds.filter(
      (id) => !currentPermissionIds.includes(id),
    );

    const updatedRole = await this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $addToSet: { permissions: { $each: newPermissionIds } } },
        { new: true },
      )
      .populate<{ permissions: Permission[] }>('permissions')
      .exec();
    if (!updatedRole) {
      throw new BadRequestException(`Role with ID '${roleId}' not found`);
    }

    return updatedRole;
  }

  async removePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleWWithPopulatePermission> {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $pull: { permissions: { $in: permissionIds } } },
        { new: true },
      )
      .populate<{ permissions: Permission[] }>('permissions')
      .exec();

    if (!updatedRole) {
      throw new BadRequestException(`Role with ID '${roleId}' not found`);
    }

    return updatedRole;
  }
}
