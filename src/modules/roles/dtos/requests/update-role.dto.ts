// src/modules/roles/dtos/requests/update-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

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
    example: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
    description: 'New list of permission IDs to assign to the role',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
