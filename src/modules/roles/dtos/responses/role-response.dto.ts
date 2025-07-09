// src/modules/roles/dtos/responses/role-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';
import {
  fromPermissionToResponseDto,
  PermissionResponseDto,
} from 'src/modules/permissions/dtos/responses/permission-response.dto';
import { Permission } from 'src/modules/permissions/schemas/permission.schema';
import { Role, RoleWWithPopulatePermission } from '../../schemas/role.schema';

export class RoleResponseDto {
  @ApiProperty({ example: '507f191e810c19729de860ea' })
  _id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[] | string[];

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  updatedAt: Date;
}

export function fromRoleToResponseDto(role: Role): RoleResponseDto {
  const responseDto = new RoleResponseDto();
  responseDto._id = role._id.toString();
  responseDto.name = role.roleName;
  responseDto.permissions = role.permissions.map(
    (permission: mongoose.Types.ObjectId) => {
      return permission.toString();
    },
  );
  responseDto.createdAt = role.createdAt;
  responseDto.updatedAt = role.updatedAt;
  return responseDto;
}

export function fromRoleWithPermissionsToResponseDto(
  role: RoleWWithPopulatePermission,
): RoleResponseDto {
  const responseDto = new RoleResponseDto();
  responseDto._id = role._id.toString();
  responseDto.name = role.roleName;
  responseDto.permissions = role.permissions.map((permission: Permission) => {
    return fromPermissionToResponseDto(permission);
  });
  responseDto.createdAt = role.createdAt;
  responseDto.updatedAt = role.updatedAt;
  return responseDto;
}
