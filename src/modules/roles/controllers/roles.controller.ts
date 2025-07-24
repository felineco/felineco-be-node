// src/modules/roles/controllers/roles.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MongoIdPathParamDto } from 'src/common/dtos/mongo-id-path-param.dto';
import { PagingQueryOptions } from 'src/common/dtos/page-query-options.dto';
import { PagingResponse } from 'src/common/dtos/page-response.dto';
import { AddPermissionsDto } from '../dtos/requests/add-permissions.dto';
import { CreateRoleDto } from '../dtos/requests/create-role.dto';
import { RemovePermissionsDto } from '../dtos/requests/remove-permissions.dto';
import { UpdateRoleDto } from '../dtos/requests/update-role.dto';
import {
  fromRoleToResponseDto,
  fromRoleWithPermissionsToResponseDto,
  RoleResponseDto,
} from '../dtos/responses/role-response.dto';
import { RolesService } from '../services/roles.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.rolesService.create({
      roleName: createRoleDto.roleName,
      permissionIds: createRoleDto.permissionIds,
    });
    return fromRoleToResponseDto(role);
  }

  @Get()
  async findAll(
    @Query() pageOptionsDto: PagingQueryOptions,
  ): Promise<PagingResponse<RoleResponseDto>> {
    const rolesPage = await this.rolesService.findAll(pageOptionsDto);
    const mappedData = rolesPage.data.map((role) =>
      fromRoleWithPermissionsToResponseDto(role),
    );
    return new PagingResponse<RoleResponseDto>(mappedData, rolesPage.meta);
  }

  @Get(':id')
  async findOne(
    @Param() params: MongoIdPathParamDto,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.findOne(params.id);
    return fromRoleWithPermissionsToResponseDto(role);
  }

  @Patch(':id')
  async update(
    @Param() params: MongoIdPathParamDto,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const updatedRole = await this.rolesService.update(
      params.id,
      { roleName: updateRoleDto.roleName },
      updateRoleDto.permissionIds,
    );
    return fromRoleWithPermissionsToResponseDto(updatedRole);
  }

  @Delete(':id')
  async remove(
    @Param() params: MongoIdPathParamDto,
  ): Promise<{ message: string }> {
    await this.rolesService.remove(params.id);
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  async addPermissions(
    @Param() params: MongoIdPathParamDto,
    @Body() addPermissionsDto: AddPermissionsDto,
  ): Promise<RoleResponseDto> {
    const updatedRole = await this.rolesService.addPermissions(
      params.id,
      addPermissionsDto.permissionIds,
    );
    return fromRoleWithPermissionsToResponseDto(updatedRole);
  }

  @Delete(':id/permissions')
  async removePermissions(
    @Param() params: MongoIdPathParamDto,
    @Body() removePermissionsDto: RemovePermissionsDto,
  ): Promise<RoleResponseDto> {
    const updatedRole = await this.rolesService.removePermissions(
      params.id,
      removePermissionsDto.permissionIds,
    );
    return fromRoleWithPermissionsToResponseDto(updatedRole);
  }
}
