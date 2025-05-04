// src/modules/roles/dtos/requests/update-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'Editor',
    description: 'Updated role name',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleName?: string;

  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'New list of permission IDs to assign to the role',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
