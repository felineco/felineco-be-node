// src/modules/permissions/dtos/responses/permission-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Action, Privilege } from 'src/common/enums/permission.enum';
import { Permission } from '../../schemas/permission.schema';

export class PermissionResponseDto {
  @ApiProperty({ example: '507f191e810c19729de860ea' })
  _id: string;

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
  responseDto._id = permission._id.toString();
  responseDto.object = permission.privilege;
  responseDto.action = permission.action;
  responseDto.createdAt = permission.createdAt;
  responseDto.updatedAt = permission.updatedAt;
  return responseDto;
}
