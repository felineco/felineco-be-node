// src/modules/permissions/services/permissions.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Action, Privilege } from 'src/common/enums/permission.enum';
import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponse,
  PagingResponseMeta,
} from '../../../common/dtos/page-response.dto';
import { Permission, PermissionDocument } from '../schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(permissionData: {
    privilege: Privilege;
    action: Action;
  }): Promise<Permission> {
    try {
      const permission = new this.permissionModel(permissionData);
      return await permission.save();
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new BadRequestException(
          `Permission with privilege '${permissionData.privilege}' and action '${permissionData.action}' already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(
    pageOptions: PagingQueryOptions,
  ): Promise<PagingResponse<Permission>> {
    const [sortField, sortOrder] = pageOptions.mongoSortParams;

    const [permissions, itemCount] = await Promise.all([
      this.permissionModel
        .find()
        .sort({ [sortField]: sortOrder })
        .skip(pageOptions.skip)
        .limit(pageOptions.limit)
        .exec(),
      this.permissionModel.countDocuments().exec(),
    ]);

    const pageMetaDto = new PagingResponseMeta({
      page: pageOptions.page,
      limit: pageOptions.limit,
      itemCount,
    });

    return new PagingResponse(permissions, pageMetaDto);
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionModel.findById(id).exec();

    if (!permission) {
      throw new BadRequestException(`Permission with ID '${id}' not found`);
    }

    return permission;
  }

  async update(
    id: string,
    permissionData: Partial<Permission>,
  ): Promise<Permission> {
    try {
      const updatedPermission = await this.permissionModel
        .findByIdAndUpdate(id, permissionData, { new: true })
        .exec();

      if (!updatedPermission) {
        throw new BadRequestException(`Permission with ID '${id}' not found`);
      }

      return updatedPermission;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 11000) {
        throw new BadRequestException(
          `Permission with privilege '${permissionData.privilege}' and action '${permissionData.action}' already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new BadRequestException(`Permission with ID '${id}' not found`);
    }
  }
}
