// src/modules/auth/services/auth.service.spec.ts
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { Operation, Privilege } from 'src/common/enums/permission.enum';
import { Permission } from 'src/modules/permissions/schemas/permission.schema';
import { RoleWWithPopulatePermission } from 'src/modules/roles/schemas/role.schema';
import {
  User,
  UserWithPopulateRoleAndPermission,
} from 'src/modules/users/schemas/user.schema';
import { CryptoService } from '../../../common/services/crypto.service';
import { UsersService } from '../../users/services/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let cryptoService: jest.Mocked<CryptoService>;

  // Mock data
  const mockUserId = new mongoose.Types.ObjectId();
  const mockRoleId = new mongoose.Types.ObjectId();
  const mockPermissionId = new mongoose.Types.ObjectId();

  const mockPermission: Permission = {
    _id: mockPermissionId,
    privilege: Privilege.USER,
    operation: Operation.READ,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRole: RoleWWithPopulatePermission = {
    _id: mockRoleId,
    roleName: 'Admin',
    permissions: [mockPermission],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    _id: mockUserId,
    email: 'test@example.com',
    hashPassword: 'hashedpassword123',
    roles: [],
    language: LanguageEnum.VI_VN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithPermissions: UserWithPopulateRoleAndPermission = {
    ...mockUser,
    roles: [
      {
        ...mockRole,
        permissions: [mockPermission],
      },
    ],
  };

  const mockJwtPayload: JwtPayload = {
    sub: mockUserId.toString(),
    permissions: [
      {
        privilege: Privilege.USER,
        operation: Operation.READ,
      },
    ],
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    accessTokenExpiresAt: new Date(Date.now() + 86400000), // 1 day
    refreshTokenExpiresAt: new Date(Date.now() + 604800000), // 7 days
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            getUserJwtPayload: jest.fn(),
            getUserPermissions: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const configs: Record<string, string> = {
                'auth.jwt.secret': 'test-secret',
                'auth.jwt.expiresIn': '1d',
                'auth.jwt.refreshExpiresIn': '7d',
              };
              return configs[key];
            }),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            comparePasswords: jest.fn(),
            hashPassword: jest.fn(),
            randomPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    cryptoService = module.get(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      usersService.findByEmail.mockResolvedValue(mockUserWithPermissions);
      cryptoService.comparePasswords.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(cryptoService.comparePasswords).toHaveBeenCalledWith(
        password,
        mockUserWithPermissions.hashPassword,
      );
      expect(result).toEqual(mockUserWithPermissions);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      usersService.findByEmail.mockResolvedValue(mockUserWithPermissions);
      cryptoService.comparePasswords.mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw error when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      usersService.findByEmail.mockRejectedValue(
        new BadRequestException(`User with email '${email}' not found`),
      );

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return tokens for valid user', async () => {
      usersService.getUserJwtPayload.mockResolvedValue(mockJwtPayload);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.login(mockUserWithPermissions);

      expect(usersService.getUserJwtPayload).toHaveBeenCalledWith(
        mockUserId.toString(),
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      const refreshTokenPayload = {
        sub: mockUserId.toString(),
        tokenType: 'refresh',
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      jwtService.verify.mockReturnValue(refreshTokenPayload);
      usersService.getUserJwtPayload.mockResolvedValue(mockJwtPayload);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.refreshToken(mockTokens.refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(mockTokens.refreshToken, {
        secret: 'test-secret',
      });
      expect(result).toMatchObject({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      const invalidTokenPayload = {
        sub: mockUserId.toString(),
        tokenType: 'access', // Wrong type
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      jwtService.verify.mockReturnValue(invalidTokenPayload);

      await expect(
        service.refreshToken(mockTokens.refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateToken', () => {
    it('should return payload for valid token', async () => {
      const validToken = 'valid.jwt.token';
      const expectedPayload = {
        sub: mockUserId.toString(),
        permissions: [mockPermission],
        iat: Date.now(),
        exp: Date.now() + 86400000,
      };

      jwtService.verify.mockReturnValue(expectedPayload);

      const result = await service.validateToken(validToken);

      expect(jwtService.verify).toHaveBeenCalledWith(validToken, {
        secret: 'test-secret',
      });
      expect(result).toEqual(expectedPayload);
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken(invalidToken);

      expect(jwtService.verify).toHaveBeenCalledWith(invalidToken, {
        secret: 'test-secret',
      });
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      const expiredToken = 'expired.jwt.token';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await service.validateToken(expiredToken);

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user with populated roles and permissions', async () => {
      const userId = mockUserId.toString();

      usersService.findOne.mockResolvedValue(mockUserWithPermissions);

      const result = await service.getCurrentUser(userId);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserWithPermissions);
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].permissions).toHaveLength(1);
    });

    it('should throw error when user is not found', async () => {
      const userId = 'nonexistent-id';

      usersService.findOne.mockRejectedValue(
        new BadRequestException(`User with ID "${userId}" not found`),
      );

      await expect(service.getCurrentUser(userId)).rejects.toThrow(
        new BadRequestException(`User with ID "${userId}" not found`),
      );

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
    });
  });

  describe('validateOrCreateGoogleUser', () => {
    it('should return existing user if found', async () => {
      const googleUserInfo = {
        email: 'test@example.com',
        googleId: 'google123',
      };

      usersService.findByEmail.mockResolvedValue(mockUserWithPermissions);

      const result = await service.validateOrCreateGoogleUser(googleUserInfo);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        googleUserInfo.email,
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUserWithPermissions);
    });

    it('should create new user if not found', async () => {
      const googleUserInfo = {
        email: 'newuser@example.com',
        googleId: 'google123',
      };
      const randomPassword = 'random-password-123';
      const newUser = { ...mockUser, email: googleUserInfo.email };
      const newUserWithPermissions: UserWithPopulateRoleAndPermission = {
        ...mockUserWithPermissions,
        email: googleUserInfo.email,
        roles: [],
      };

      usersService.findByEmail
        .mockRejectedValueOnce(new BadRequestException('User not found')) // First call - user doesn't exist
        .mockResolvedValueOnce(newUserWithPermissions); // Second call - return created user

      cryptoService.randomPassword.mockResolvedValue(randomPassword);
      usersService.create.mockResolvedValue(newUser);

      const result = await service.validateOrCreateGoogleUser(googleUserInfo);

      expect(cryptoService.randomPassword).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith({
        email: googleUserInfo.email,
        password: randomPassword,
      });
      expect(result).toMatchObject({
        ...newUser,
        roles: [],
      });
    });
  });

  describe('validateOrCreateFacebookUser', () => {
    it('should return existing user if found', async () => {
      const facebookUserInfo = {
        email: 'test@example.com',
        facebookId: 'facebook123',
      };

      usersService.findByEmail.mockResolvedValue(mockUserWithPermissions);

      const result =
        await service.validateOrCreateFacebookUser(facebookUserInfo);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        facebookUserInfo.email,
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUserWithPermissions);
    });

    it('should create new user if not found', async () => {
      const facebookUserInfo = {
        email: 'newuser@example.com',
        facebookId: 'facebook123',
      };
      const randomPassword = 'random-password-123';
      const newUser = { ...mockUser, email: facebookUserInfo.email };
      const newUserWithPermissions: UserWithPopulateRoleAndPermission = {
        ...mockUserWithPermissions,
        email: facebookUserInfo.email,
        roles: [],
      };

      usersService.findByEmail
        .mockRejectedValueOnce(new BadRequestException('User not found')) // First call - user doesn't exist
        .mockResolvedValueOnce(newUserWithPermissions); // Second call - return created user

      cryptoService.randomPassword.mockResolvedValue(randomPassword);
      usersService.create.mockResolvedValue(newUser);

      const result =
        await service.validateOrCreateFacebookUser(facebookUserInfo);

      expect(cryptoService.randomPassword).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith({
        email: facebookUserInfo.email,
        password: randomPassword,
      });
      expect(result).toMatchObject({
        ...newUser,
        roles: [],
      });
    });
  });

  describe('loginWithGoogle', () => {
    it('should generate tokens for Google user', async () => {
      usersService.getUserJwtPayload.mockResolvedValue(mockJwtPayload);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.loginWithGoogle(mockUserWithPermissions);

      expect(result).toMatchObject({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });

  describe('loginWithFacebook', () => {
    it('should generate tokens for Facebook user', async () => {
      usersService.getUserJwtPayload.mockResolvedValue(mockJwtPayload);
      jwtService.sign.mockReturnValueOnce(mockTokens.accessToken);
      jwtService.sign.mockReturnValueOnce(mockTokens.refreshToken);

      const result = await service.loginWithFacebook(mockUserWithPermissions);

      expect(result).toMatchObject({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });
  });
});
