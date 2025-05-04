// src/modules/permissions/dtos/requests/update-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Action } from 'src/common/enums/permission.enum';
import { Privilege } from 'src/common/enums/permission.enum';

export class UpdatePermissionDto {
  @ApiProperty({
    enum: Privilege,
    example: Privilege.USER,
    required: false,
    description: 'Resource/entity being protected',
  })
  @IsEnum(Privilege)
  @IsOptional()
  privilege?: Privilege;

  @ApiProperty({
    enum: Action,
    example: Action.CREATE,
    required: false,
    description: 'Action being performed on the object',
  })
  @IsEnum(Action)
  @IsOptional()
  action?: Action;
}
