// src/modules/users/users.controller.spec.ts
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
import {
  PagingResponse,
  PagingResponseMeta,
} from '../../../common/dtos/page-response.dto';
import { UsersController } from '../controllers/users.controller';
import { AddRolesDto } from '../dtos/requests/add-roles.dto';
import { CreateUserDto } from '../dtos/requests/create-user.dto';
import { RemoveRolesDto } from '../dtos/requests/remove-roles.dto';
import { UpdateUserDto } from '../dtos/requests/update-user.dto';
import {
  User,
  UserWithPopulateRoleAndPermission,
} from '../schemas/user.schema';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  // Mock data
  const mockUserId = new mongoose.Types.ObjectId();
  const mockRoleId = new mongoose.Types.ObjectId();

  const mockUser: User = {
    _id: mockUserId,
    email: 'test@example.com',
    hashPassword: 'hashedpassword123',
    roles: [mockRoleId],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithRoles: UserWithPopulateRoleAndPermission = {
    _id: mockUserId,
    email: 'test@example.com',
    hashPassword: 'hashedpassword123',
    roles: [
      {
        _id: mockRoleId,
        roleName: 'Admin',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addRoles: jest.fn(),
    removeRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        roleIds: [mockRoleId.toString()],
      };

      usersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: createUserDto.password,
        roleIds: createUserDto.roleIds,
      });
      expect(result).toEqual({
        _id: mockUserId.toString(),
        email: mockUser.email,
        roles: [mockRoleId.toString()],
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw BadRequestException when user creation fails', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      usersService.create.mockRejectedValue(
        new BadRequestException('User already exists'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const pageOptions = new PagingQueryOptions();
      const mockPagingResponse = new PagingResponse(
        [mockUserWithRoles],
        new PagingResponseMeta({ page: 1, limit: 10, itemCount: 1 }),
      );

      usersService.findAll.mockResolvedValue(mockPagingResponse);

      const result = await controller.findAll(pageOptions);

      expect(usersService.findAll).toHaveBeenCalledWith(pageOptions);
      expect(result.data).toHaveLength(1);
      expect(result.meta.itemCount).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = mockUserId.toString();

      usersService.findOne.mockResolvedValue(mockUserWithRoles);

      const result = await controller.findOne(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result._id).toBe(userId);
      expect(result.email).toBe(mockUserWithRoles.email);
    });

    it('should throw BadRequestException when user not found', async () => {
      const userId = 'nonexistent-id';

      usersService.findOne.mockRejectedValue(
        new BadRequestException('User not found'),
      );

      await expect(controller.findOne(userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = mockUserId.toString();
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        roleIds: [mockRoleId.toString()],
      };

      const updatedUser = {
        ...mockUserWithRoles,
        email: 'updated@example.com',
      };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        updateUserDto.roleIds,
      );
      expect(result.email).toBe('updated@example.com');
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = mockUserId.toString();

      usersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(userId);

      expect(usersService.remove).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'User deleted successfully' });
    });
  });

  describe('addRoles', () => {
    it('should add roles to a user', async () => {
      const userId = mockUserId.toString();
      const addRolesDto: AddRolesDto = {
        roleIds: [mockRoleId.toString()],
      };

      usersService.addRoles.mockResolvedValue(mockUserWithRoles);

      const result = await controller.addRoles(userId, addRolesDto);

      expect(usersService.addRoles).toHaveBeenCalledWith(
        userId,
        addRolesDto.roleIds,
      );
      expect(result.roles).toHaveLength(1);
    });
  });

  describe('removeRoles', () => {
    it('should remove roles from a user', async () => {
      const userId = mockUserId.toString();
      const removeRolesDto: RemoveRolesDto = {
        roleIds: [mockRoleId.toString()],
      };

      const userWithoutRoles = { ...mockUserWithRoles, roles: [] };
      usersService.removeRoles.mockResolvedValue(userWithoutRoles);

      const result = await controller.removeRoles(userId, removeRolesDto);

      expect(usersService.removeRoles).toHaveBeenCalledWith(
        userId,
        removeRolesDto.roleIds,
      );
      expect(result.roles).toHaveLength(0);
    });
  });
});
