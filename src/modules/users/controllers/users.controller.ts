// src/modules/users/controllers/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/requests/create-user.dto';
import { UpdateUserDto } from '../dtos/requests/update-user.dto';
import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
import { PagingResponse } from 'src/common/dtos/page-response.dto';
import { AddRolesDto } from '../dtos/requests/add-roles.dto';
import { RemoveRolesDto } from '../dtos/requests/remove-roles.dto';
import {
  UserResponseDto,
  fromUserToResponseDto,
} from '../dtos/responses/user-response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create({
      email: createUserDto.email,
      password: createUserDto.password,
      roleIds: createUserDto.roleIds,
    });
    return fromUserToResponseDto(user);
  }

  @Get()
  async findAll(
    @Query() pageOptionsDto: PagingQueryOptions,
  ): Promise<PagingResponse<UserResponseDto>> {
    const usersPage = await this.usersService.findAll(pageOptionsDto);
    const mappedData = usersPage.data.map((user) =>
      fromUserToResponseDto(user),
    );
    return new PagingResponse<UserResponseDto>(mappedData, usersPage.meta);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return fromUserToResponseDto(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(
      id,
      updateUserDto,
      updateUserDto.roleIds,
    );
    return fromUserToResponseDto(updatedUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Post(':id/roles')
  async addRoles(
    @Param('id') id: string,
    @Body() addRolesDto: AddRolesDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.addRoles(
      id,
      addRolesDto.roleIds,
    );
    return fromUserToResponseDto(updatedUser);
  }

  @Delete(':id/roles')
  async removeRoles(
    @Param('id') id: string,
    @Body() removeRolesDto: RemoveRolesDto,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.removeRoles(
      id,
      removeRolesDto.roleIds,
    );
    return fromUserToResponseDto(updatedUser);
  }
}
