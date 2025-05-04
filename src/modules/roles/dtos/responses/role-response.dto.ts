// src/modules/roles/dtos/responses/role-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../entities/role.entity';
import {
  PermissionResponseDto,
  fromPermissionToResponseDto,
} from 'src/modules/permissions/dtos/responses/permission-response.dto';

export class RoleResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Admin' })
  name: string;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  updatedAt: Date;
}

export function fromRoleToResponseDto(role: Role): RoleResponseDto {
  const responseDto = new RoleResponseDto();
  responseDto.id = role.id;
  responseDto.name = role.roleName;
  responseDto.permissions = role.permissions
    ? role.permissions.map((permission) =>
        fromPermissionToResponseDto(permission),
      )
    : [];
  responseDto.createdAt = role.createdAt;
  responseDto.updatedAt = role.updatedAt;
  return responseDto;
}
