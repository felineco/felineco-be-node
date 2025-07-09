// src/modules/permissions/controllers/permissions.controller.ts
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
import { CreatePermissionDto } from '../dtos/requests/create-permission.dto';
import { UpdatePermissionDto } from '../dtos/requests/update-permission.dto';
import {
  fromPermissionToResponseDto,
  PermissionResponseDto,
} from '../dtos/responses/permission-response.dto';
import { Permission } from '../schemas/permission.schema';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.create({
      privilege: createPermissionDto.privilege,
      action: createPermissionDto.action,
    });
    return fromPermissionToResponseDto(permission);
  }

  @Get()
  async findAll(
    @Query() pageOptionsDto: PagingQueryOptions,
  ): Promise<PagingResponse<PermissionResponseDto>> {
    const permissionsPage =
      await this.permissionsService.findAll(pageOptionsDto);
    const mappedData = permissionsPage.data.map((permission) =>
      fromPermissionToResponseDto(permission),
    );
    return new PagingResponse<PermissionResponseDto>(
      mappedData,
      permissionsPage.meta,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.findOne(id);
    return fromPermissionToResponseDto(permission);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const updateData: Partial<Permission> = {
      ...updatePermissionDto,
    };
    const updatedPermission = await this.permissionsService.update(
      id,
      updateData,
    );
    return fromPermissionToResponseDto(updatedPermission);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.permissionsService.remove(id);
    return { message: 'Permission deleted successfully' };
  }
}
