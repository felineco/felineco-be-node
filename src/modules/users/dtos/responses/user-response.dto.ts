// src/modules/users/dtos/responses/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  fromRoleWithPermissionsToResponseDto,
  RoleResponseDto,
} from 'src/modules/roles/dtos/responses/role-response.dto';
import {
  User,
  UserWithPopulateRoleAndPermission,
} from '../../schemas/user.schema';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  _id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ type: [RoleResponseDto] })
  roles: RoleResponseDto[] | string[];

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  updatedAt: Date;
}

export function fromUserToResponseDto(user: User): UserResponseDto {
  const responseDto = new UserResponseDto();
  responseDto._id = user._id.toString();
  responseDto.email = user.email;
  responseDto.roles = user.roles.map((role) => role.toString());
  responseDto.createdAt = user.createdAt;
  responseDto.updatedAt = user.updatedAt;
  return responseDto;
}

export function fromUserWithPopulateToResponseDto(
  user: UserWithPopulateRoleAndPermission,
): UserResponseDto {
  const responseDto = new UserResponseDto();
  responseDto._id = user._id.toString();
  responseDto.email = user.email;
  responseDto.roles = user.roles.map((role) =>
    fromRoleWithPermissionsToResponseDto(role),
  );
  responseDto.createdAt = user.createdAt;
  responseDto.updatedAt = user.updatedAt;
  return responseDto;
}
