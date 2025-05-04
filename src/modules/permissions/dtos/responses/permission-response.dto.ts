// src/modules/permissions/dtos/responses/permission-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Action, Privilege } from 'src/common/enums/permission.enum';
import { Permission } from '../../entities/permission.entity';

export class PermissionResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({
    enum: Privilege,
    example: Privilege.USER,
    description: 'Resource/entity being protected',
  })
  object: Privilege;

  @ApiProperty({
    enum: Action,
    example: Action.CREATE,
    description: 'Action being performed on the object',
  })
  action: Action;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  updatedAt: Date;
}

export function fromPermissionToResponseDto(
  permission: Permission,
): PermissionResponseDto {
  const responseDto = new PermissionResponseDto();
  responseDto.id = permission.id;
  responseDto.object = permission.privilege;
  responseDto.action = permission.action;
  responseDto.createdAt = permission.createdAt;
  responseDto.updatedAt = permission.updatedAt;
  return responseDto;
}
