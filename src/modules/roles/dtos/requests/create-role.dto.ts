// src/modules/roles/dtos/requests/create-role.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Admin', description: 'Role name' })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({
    example: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
    description: 'List of permission IDs to assign to the role',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissionIds?: string[];
}
