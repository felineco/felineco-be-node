// src/modules/roles/dtos/requests/add-permissions.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class AddPermissionsDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'List of permission IDs to add to the role',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
