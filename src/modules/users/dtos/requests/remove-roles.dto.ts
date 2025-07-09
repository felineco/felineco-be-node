// src/modules/users/dtos/requests/remove-roles.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class RemoveRolesDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    description: 'List of role IDs to remove from the user',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  roleIds: string[];
}
