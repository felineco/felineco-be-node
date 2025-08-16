// src/modules/permissions/dtos/requests/create-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Operation, Privilege } from 'src/common/enums/permission.enum';

export class CreatePermissionDto {
  @ApiProperty({
    enum: Privilege,
    example: Privilege.USER,
    description: 'Resource/entity being protected',
  })
  @IsEnum(Privilege)
  @IsNotEmpty()
  privilege: Privilege;

  @ApiProperty({
    enum: Operation,
    example: Operation.CREATE,
    description: 'Action being performed on the object',
  })
  @IsEnum(Operation)
  @IsNotEmpty()
  action: Operation;
}
