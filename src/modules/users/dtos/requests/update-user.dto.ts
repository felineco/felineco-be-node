// src/modules/users/dtos/requests/update-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: ['507f1f77bcf86cd799439011'],
    description: 'List of role IDs to assign to the user',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  roleIds?: string[];
}
