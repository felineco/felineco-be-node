// src/modules/permissions/dtos/requests/update-permission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Operation, Privilege } from 'src/common/enums/permission.enum';

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
    enum: Operation,
    example: Operation.CREATE,
    required: false,
    description: 'Action being performed on the object',
  })
  @IsEnum(Operation)
  @IsOptional()
  operation?: Operation;
}
