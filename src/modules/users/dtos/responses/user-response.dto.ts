// src/modules/users/dtos/responses/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../entities/user.entity';
import {
  RoleResponseDto,
  fromRoleToResponseDto,
} from 'src/modules/roles/dtos/responses/role-response.dto';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ type: [RoleResponseDto] })
  roles: RoleResponseDto[];

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-03T10:30:00Z' })
  updatedAt: Date;
}

export function fromUserToResponseDto(user: User): UserResponseDto {
  const responseDto = new UserResponseDto();
  responseDto.id = user.id;
  responseDto.email = user.email;
  responseDto.roles = user.roles
    ? user.roles.map((role) => fromRoleToResponseDto(role))
    : [];
  responseDto.createdAt = user.createdAt;
  responseDto.updatedAt = user.updatedAt;
  return responseDto;
}
