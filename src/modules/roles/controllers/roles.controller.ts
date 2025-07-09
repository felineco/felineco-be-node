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
  async findOne(@Param('id') id: string): Promise<RoleResponseDto> {
    const role = await this.rolesService.findOne(id);
    return fromRoleWithPermissionsToResponseDto(role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const updatedRole = await this.rolesService.update(
      id,
      { roleName: updateRoleDto.roleName },
      updateRoleDto.permissionIds,
    );
    return fromRoleWithPermissionsToResponseDto(updatedRole);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.rolesService.remove(id);
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  async addPermissions(
    @Param('id') id: string,
    @Body() addPermissionsDto: AddPermissionsDto,
  ): Promise<RoleResponseDto> {
    const updatedRole = await this.rolesService.addPermissions(
      id,
      addPermissionsDto.permissionIds,
    );
    return fromRoleWithPermissionsToResponseDto(updatedRole);
  }

  @Delete(':id/permissions')
  async removePermissions(
    @Param('id') id: string,
    @Body() removePermissionsDto: RemovePermissionsDto,
  ): Promise<RoleResponseDto> {
    const updatedRole = await this.rolesService.removePermissions(
      id,
      removePermissionsDto.permissionIds,
    );
    return fromRoleWithPermissionsToResponseDto(updatedRole);
  }
}
