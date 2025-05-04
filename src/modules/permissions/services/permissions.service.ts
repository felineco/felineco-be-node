// src/modules/permissions/services/permissions.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Action, Privilege } from 'src/common/enums/permission.enum';
import {
  PagingQueryOptions,
  toTypeOrmSortOrder,
} from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponse,
  PagingResponseMeta,
} from '../../../common/dtos/page-response.dto';
import { TABLE_NAME } from 'src/common/enums/table-name.enum';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(permissionData: {
    privilege: Privilege;
    action: Action;
  }): Promise<Permission> {
    const permission = this.permissionsRepository.create(permissionData);
    return await this.permissionsRepository.save(permission);
  }

  async findAll(
    pageOptions: PagingQueryOptions,
  ): Promise<PagingResponse<Permission>> {
    const queryBuilder = this.permissionsRepository.createQueryBuilder(
      TABLE_NAME.PERMISSION,
    );

    const [sortField, sortOrder] = pageOptions.sortParams;
    queryBuilder
      .orderBy(
        `${TABLE_NAME.PERMISSION}.${sortField}`,
        toTypeOrmSortOrder(sortOrder),
      )
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

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new BadRequestException(`Permission with ID '${id}' not found`);
    }

    return permission;
  }

  async update(
    id: string,
    permissionData: DeepPartial<Permission>,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    // Check if updated privilege+action combination already exists
    const updatedPermission = this.permissionsRepository.merge(
      permission,
      permissionData,
    );
    return await this.permissionsRepository.save(updatedPermission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!permission) {
      throw new BadRequestException(`Permission with ID '${id}' not found`);
    }

    // Remove the permission from all associated roles
    if (permission.roles && permission.roles.length > 0) {
      // Clear the roles array to remove the associations in the join table
      permission.roles = [];
      await this.permissionsRepository.save(permission);
    }

    await this.permissionsRepository.remove(permission);
  }
}
