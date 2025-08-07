// // COMMENT OUT TO PREVENT UNAUTHORIZED ACCESS FOR NOW
// // src/modules/users/controllers/users.controller.ts
// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Query,
// } from '@nestjs/common';
// import { ApiTags } from '@nestjs/swagger';
// import { Auth } from 'src/common/decorators/auth.decorator';
// import { MongoIdPathParamDto } from 'src/common/dtos/mongo-id-path-param.dto';
// import { PagingResponse } from 'src/common/dtos/page-response.dto';
// import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
// import { AddRolesDto } from '../dtos/requests/add-roles.dto';
// import { CreateUserDto } from '../dtos/requests/create-user.dto';
// import { RemoveRolesDto } from '../dtos/requests/remove-roles.dto';
// import { UpdateUserDto } from '../dtos/requests/update-user.dto';
// import {
//   UserResponseDto,
//   fromUserToResponseDto,
//   fromUserWithPopulateToResponseDto,
// } from '../dtos/responses/user-response.dto';
// import { UsersService } from '../services/users.service';

// @ApiTags('Users')
// @Controller('users')
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   @Post()
//   async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
//     const user = await this.usersService.create({
//       email: createUserDto.email,
//       password: createUserDto.password,
//       roleIds: createUserDto.roleIds,
//     });
//     return fromUserToResponseDto(user);
//   }

//   @Auth()
//   @Get()
//   async findAll(
//     @Query() pageOptionsDto: PagingQueryOptions,
//   ): Promise<PagingResponse<UserResponseDto>> {
//     const usersPage = await this.usersService.findAll(pageOptionsDto);
//     const mappedData = usersPage.data.map((user) =>
//       fromUserWithPopulateToResponseDto(user),
//     );
//     return new PagingResponse<UserResponseDto>(mappedData, usersPage.meta);
//   }

//   @Auth()
//   @Get(':id')
//   async findOne(
//     @Param() params: MongoIdPathParamDto,
//   ): Promise<UserResponseDto> {
//     const user = await this.usersService.findOne(params.id);
//     return fromUserWithPopulateToResponseDto(user);
//   }

//   @Auth()
//   @Patch(':id')
//   async update(
//     @Param() params: MongoIdPathParamDto,
//     @Body() updateUserDto: UpdateUserDto,
//   ): Promise<UserResponseDto> {
//     const updatedUser = await this.usersService.update(
//       params.id,
//       updateUserDto,
//       updateUserDto.roleIds,
//     );
//     return fromUserWithPopulateToResponseDto(updatedUser);
//   }

//   @Auth()
//   @Delete(':id')
//   async remove(
//     @Param() params: MongoIdPathParamDto,
//   ): Promise<{ message: string }> {
//     await this.usersService.remove(params.id);
//     return { message: 'User deleted successfully' };
//   }

//   @Auth()
//   @Post(':id/roles')
//   async addRoles(
//     @Param() params: MongoIdPathParamDto,
//     @Body() addRolesDto: AddRolesDto,
//   ): Promise<UserResponseDto> {
//     const updatedUser = await this.usersService.addRoles(
//       params.id,
//       addRolesDto.roleIds,
//     );
//     return fromUserWithPopulateToResponseDto(updatedUser);
//   }

//   @Auth()
//   @Delete(':id/roles')
//   async removeRoles(
//     @Param() params: MongoIdPathParamDto,
//     @Body() removeRolesDto: RemoveRolesDto,
//   ): Promise<UserResponseDto> {
//     const updatedUser = await this.usersService.removeRoles(
//       params.id,
//       removeRolesDto.roleIds,
//     );
//     return fromUserWithPopulateToResponseDto(updatedUser);
//   }
// }
