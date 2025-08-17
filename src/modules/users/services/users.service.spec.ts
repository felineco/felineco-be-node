describe('UsersController', () => {
  it('should have tests', () => {
    // Placeholder for the test suite
    expect(true).toBe(true); // Placeholder for the test suite
  });
});
// // src/modules/users/services/users.service.spec.ts
// import { BadRequestException } from '@nestjs/common';
// import { getModelToken } from '@nestjs/mongoose';
// import { Test, TestingModule } from '@nestjs/testing';
// import mongoose, { Model } from 'mongoose';
// import { PagingQueryOptions } from '../../../common/dtos/page-query-options.dto';
// import { PagingResponse } from '../../../common/dtos/page-response.dto';
// import { CryptoService } from '../../../common/services/crypto.service';
// import { Role, RoleDocument } from '../../roles/schemas/role.schema';
// import { User, UserDocument } from '../schemas/user.schema';
// import { UsersService } from './users.service';

// describe('UsersService', () => {
//   let service: UsersService;
//   let userModel: jest.Mocked<Model<UserDocument>>;
//   let roleModel: jest.Mocked<Model<RoleDocument>>;
//   let cryptoService: jest.Mocked<CryptoService>;

//   // Mock data
//   const mockUserId = new mongoose.Types.ObjectId();
//   const mockRoleId = new mongoose.Types.ObjectId();
//   const mockPermissionId = new mongoose.Types.ObjectId();

//   const mockUser = {
//     _id: mockUserId,
//     email: 'test@example.com',
//     hashPassword: 'hashedpassword123',
//     roles: [mockRoleId],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     save: jest.fn(),
//   };

//   const mockRole = {
//     _id: mockRoleId,
//     roleName: 'Admin',
//     permissions: [mockPermissionId],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockUserWithPopulatedRoles = {
//     ...mockUser,
//     roles: [mockRole],
//   };

//   const createMockQuery = (data: any): any =>
//     ({
//       populate: jest.fn().mockReturnThis(),
//       sort: jest.fn().mockReturnThis(),
//       skip: jest.fn().mockReturnThis(),
//       limit: jest.fn().mockReturnThis(),
//       exec: jest.fn().mockResolvedValue(data),
//     }) as any;

//   const createMockUserModel = () => {
//     const mockModel = jest.fn().mockImplementation((data: Partial<User>) => ({
//       ...data,
//       save: jest.fn().mockResolvedValue({ ...mockUser, ...data }),
//     }));

//     Object.assign(mockModel, {
//       create: jest.fn(),
//       find: jest.fn(),
//       findOne: jest.fn(),
//       findById: jest.fn(),
//       findByIdAndUpdate: jest.fn(),
//       findByIdAndDelete: jest.fn(),
//       countDocuments: jest.fn(),
//     });

//     return mockModel as unknown as Model<UserDocument>;
//   };

//   const createMockRoleModel = () => ({
//     find: jest.fn(),
//   });

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         UsersService,
//         {
//           provide: getModelToken(User.name),
//           useValue: createMockUserModel(),
//         },
//         {
//           provide: getModelToken(Role.name),
//           useValue: createMockRoleModel(),
//         },
//         {
//           provide: CryptoService,
//           useValue: {
//             hashPassword: jest.fn(),
//             comparePasswords: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<UsersService>(UsersService);
//     userModel = module.get(getModelToken(User.name));
//     roleModel = module.get(getModelToken(Role.name));
//     cryptoService = module.get(CryptoService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('create', () => {
//     it('should create a new user successfully', async () => {
//       const createUserData = {
//         email: 'test@example.com',
//         password: 'password123',
//         roleIds: [mockRoleId.toString()],
//       };

//       const hashedPassword = 'hashedpassword123';
//       cryptoService.hashPassword.mockResolvedValue(hashedPassword);

//       userModel.findOne.mockReturnValue(createMockQuery(null));
//       roleModel.find.mockReturnValue(createMockQuery([mockRole]));

//       const result = await service.create(createUserData);

//       expect(cryptoService.hashPassword).toHaveBeenCalledWith(
//         createUserData.password,
//       );
//       expect(userModel.findOne).toHaveBeenCalled();
//       expect(roleModel.find).toHaveBeenCalledWith({
//         _id: { $in: createUserData.roleIds },
//       });
//       expect(result.email).toBe(createUserData.email);
//     });

//     it('should throw BadRequestException if user already exists', async () => {
//       const createUserData = {
//         email: 'existing@example.com',
//         password: 'password123',
//       };

//       userModel.findOne.mockReturnValue(createMockQuery(mockUser));

//       await expect(service.create(createUserData)).rejects.toThrow(
//         BadRequestException,
//       );
//     });

//     it('should throw BadRequestException if some roles not found', async () => {
//       const createUserData = {
//         email: 'test@example.com',
//         password: 'password123',
//         roleIds: ['nonexistent-role-id'],
//       };

//       cryptoService.hashPassword.mockResolvedValue('hashedpassword');
//       userModel.findOne.mockReturnValue(createMockQuery(null));
//       roleModel.find.mockReturnValue(createMockQuery([]));

//       await expect(service.create(createUserData)).rejects.toThrow(
//         new BadRequestException(
//           'Some role IDs were not found: nonexistent-role-id',
//         ),
//       );
//     });
//   });

//   describe('findAll', () => {
//     it('should return paginated users', async () => {
//       const pageOptions = new PagingQueryOptions();
//       const mockUsers = [mockUserWithPopulatedRoles];

//       userModel.find.mockReturnValue(createMockQuery(mockUsers));
//       userModel.countDocuments.mockReturnValue(createMockQuery(1));

//       const result = await service.findAll(pageOptions);

//       expect(userModel.find).toHaveBeenCalled();
//       expect(userModel.countDocuments).toHaveBeenCalled();
//       expect(result).toBeInstanceOf(PagingResponse);
//       expect(result.data).toHaveLength(1);
//       expect(result.meta.itemCount).toBe(1);
//     });
//   });

//   describe('findOne', () => {
//     it('should return a user by id', async () => {
//       const userId = mockUserId.toString();

//       userModel.findById.mockReturnValue(
//         createMockQuery(mockUserWithPopulatedRoles),
//       );

//       const result = await service.findOne(userId);

//       expect(userModel.findById).toHaveBeenCalledWith(userId);
//       expect(result._id).toEqual(mockUserId);
//     });

//     it('should throw BadRequestException if user not found', async () => {
//       const userId = 'nonexistent-id';

//       userModel.findById.mockReturnValue(createMockQuery(null));

//       await expect(service.findOne(userId)).rejects.toThrow(
//         new BadRequestException(`User with ID "${userId}" not found`),
//       );
//     });
//   });

//   describe('findByEmail', () => {
//     it('should return a user by email', async () => {
//       const email = 'test@example.com';

//       userModel.findOne.mockReturnValue(
//         createMockQuery(mockUserWithPopulatedRoles),
//       );

//       const result = await service.findByEmail(email);

//       expect(userModel.findOne).toHaveBeenCalledWith({ email });
//       expect(result.email).toBe(email);
//     });

//     it('should throw BadRequestException if user not found', async () => {
//       const email = 'nonexistent@example.com';

//       userModel.findOne.mockReturnValue(createMockQuery(null));

//       await expect(service.findByEmail(email)).rejects.toThrow(
//         new BadRequestException(`User with email '${email}' not found`),
//       );
//     });
//   });

//   describe('update', () => {
//     it('should update a user successfully', async () => {
//       const userId = mockUserId.toString();
//       const updateData = { email: 'updated@example.com' };
//       const roleIds = [mockRoleId.toString()];

//       userModel.findById.mockReturnValue(createMockQuery(mockUser));
//       roleModel.find.mockReturnValue(createMockQuery([mockRole]));
//       userModel.findByIdAndUpdate.mockReturnValue(
//         createMockQuery({
//           ...mockUserWithPopulatedRoles,
//           ...updateData,
//         }),
//       );

//       const result = await service.update(userId, updateData, roleIds);

//       expect(userModel.findById).toHaveBeenCalledWith(userId);
//       expect(roleModel.find).toHaveBeenCalledWith({ _id: { $in: roleIds } });
//       expect(result.email).toBe(updateData.email);
//     });

//     it('should hash password if provided in update', async () => {
//       const userId = mockUserId.toString();
//       const password: string = 'newpassword123';
//       const updateData = { password };
//       const hashedPassword = 'newhashed123';

//       cryptoService.hashPassword.mockResolvedValue(hashedPassword);
//       userModel.findById.mockReturnValue(createMockQuery(mockUser));
//       userModel.findByIdAndUpdate.mockReturnValue(
//         createMockQuery(mockUserWithPopulatedRoles),
//       );

//       await service.update(userId, updateData);

//       expect(cryptoService.hashPassword).toHaveBeenCalledWith(password);
//       expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
//         userId,
//         expect.objectContaining({ hashPassword: hashedPassword }),
//         { new: true },
//       );
//     });
//   });

//   describe('remove', () => {
//     it('should remove a user successfully', async () => {
//       const userId = mockUserId.toString();

//       userModel.findByIdAndDelete.mockReturnValue(createMockQuery(mockUser));

//       await service.remove(userId);

//       expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
//     });

//     it('should throw BadRequestException if user not found', async () => {
//       const userId = 'nonexistent-id';

//       userModel.findByIdAndDelete.mockReturnValue(createMockQuery(null));

//       await expect(service.remove(userId)).rejects.toThrow(
//         new BadRequestException(`User with ID "${userId}" not found`),
//       );
//     });
//   });

//   describe('addRoles', () => {
//     it('should add roles to a user', async () => {
//       const userId = mockUserId.toString();
//       const roleIds = [mockRoleId.toString()];

//       userModel.findById.mockReturnValue(createMockQuery(mockUser));
//       roleModel.find.mockReturnValue(createMockQuery([mockRole]));
//       userModel.findByIdAndUpdate.mockReturnValue(
//         createMockQuery(mockUserWithPopulatedRoles),
//       );

//       const result = await service.addRoles(userId, roleIds);

//       expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
//         userId,
//         { $addToSet: { roles: { $each: roleIds } } },
//         { new: true },
//       );
//       expect(result.roles).toHaveLength(1);
//     });
//   });

//   describe('removeRoles', () => {
//     it('should remove roles from a user', async () => {
//       const userId = mockUserId.toString();
//       const roleIds = [mockRoleId.toString()];

//       userModel.findByIdAndUpdate.mockReturnValue(
//         createMockQuery({ ...mockUserWithPopulatedRoles, roles: [] }),
//       );

//       const result = await service.removeRoles(userId, roleIds);

//       expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
//         userId,
//         { $pull: { roles: { $in: roleIds } } },
//         { new: true },
//       );
//       expect(result.roles).toHaveLength(0);
//     });
//   });

//   describe('getUserPermissions', () => {
//     it('should return user permissions', async () => {
//       const userId = mockUserId.toString();
//       const mockPermission = {
//         privilege: 'user',
//         operation: 'read',
//       };

//       const userWithPermissions = {
//         ...mockUser,
//         roles: [
//           {
//             ...mockRole,
//             permissions: [mockPermission],
//           },
//         ],
//       };

//       userModel.findById.mockReturnValue(createMockQuery(userWithPermissions));

//       const result = await service.getUserJwtPayload(userId);

//       expect(result).toEqual({
//         sub: mockUserId.toString(),
//         permissions: [mockPermission],
//       });
//     });

//     it('should throw BadRequestException if user not found', async () => {
//       const userId = 'nonexistent-id';

//       userModel.findById.mockReturnValue(createMockQuery(null));

//       await expect(service.getUserJwtPayload(userId)).rejects.toThrow(
//         new BadRequestException(`User with ID "${userId}" not found`),
//       );
//     });
//   });
// });
