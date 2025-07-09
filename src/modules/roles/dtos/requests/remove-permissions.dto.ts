// src/modules/roles/dtos/requests/remove-permissions.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class RemovePermissionsDto {
  @ApiProperty({
    example: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
    description: 'List of permission IDs to remove from the role',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  permissionIds: string[];
}
