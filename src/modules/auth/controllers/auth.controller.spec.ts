// src/modules/auth/controllers/auth.controller.spec.ts
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import mongoose from 'mongoose';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../../common/constants/cookie-names.constant';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock data
  const mockUserId = new mongoose.Types.ObjectId();
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    hashPassword: 'hashedpassword123',
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    accessTokenExpiresAt: new Date(Date.now() + 86400000), // 1 day
    refreshTokenExpiresAt: new Date(Date.now() + 604800000), // 7 days
  };

  const mockResponse = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockRequest: any = {
    user: mockUser,
    cookies: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshToken: jest.fn(),
            loginWithGoogle: jest.fn(),
            loginWithFacebook: jest.fn(),
            getCurrentUser: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);

    // Default config mocks
    configService.get.mockImplementation((key: string) => {
      const configs: Record<string, any> = {
        'auth.redirectUrlAfterLogin': 'http://localhost:3000/auth/callback',
        'app.environment': 'development',
      };
      return configs[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user and set cookies', async () => {
      authService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(mockRequest, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE_NAME,
        mockTokens.accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          expires: mockTokens.accessTokenExpiresAt,
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        mockTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          expires: mockTokens.refreshTokenExpiresAt,
        }),
      );
      expect(result).toEqual(mockTokens);
    });

    it('should set secure cookies in production', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'app.environment') return 'production';
        return 'http://localhost:3000/auth/callback';
      });

      const prodController = new AuthController(authService, configService);
      authService.login.mockResolvedValue(mockTokens);

      await prodController.login(mockRequest, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE_NAME,
        mockTokens.accessToken,
        expect.objectContaining({
          secure: true,
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token using cookie', async () => {
      const requestWithCookie: any = {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'valid.refresh.token',
        },
      };

      authService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refreshToken(
        {},
        mockResponse,
        requestWithCookie,
      );

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'valid.refresh.token',
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTokens);
    });

    it('should refresh token using body DTO', async () => {
      const refreshTokenDto = { refreshToken: 'valid.refresh.token' };
      const requestWithoutCookie: any = { cookies: {} };

      authService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refreshToken(
        refreshTokenDto,
        mockResponse,
        requestWithoutCookie,
      );

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'valid.refresh.token',
      );
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException when no refresh token provided', async () => {
      const requestWithoutCookie: any = { cookies: {} };

      await expect(
        controller.refreshToken({}, mockResponse, requestWithoutCookie),
      ).rejects.toThrow(new UnauthorizedException('Refresh token is required'));
    });
  });

  describe('logout', () => {
    it('should clear cookies', async () => {
      await controller.logout(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE_NAME,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
        }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
        }),
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user information', async () => {
      const mockUserWithRoles = {
        ...mockUser,
        roles: [
          {
            _id: new mongoose.Types.ObjectId(),
            roleName: 'Admin',
            permissions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const mockRequestWithJwt: any = {
        user: {
          sub: mockUserId.toString(),
          permissions: [],
        },
      };

      authService.getCurrentUser.mockResolvedValue(mockUserWithRoles);

      const result = await controller.getCurrentUser(mockRequestWithJwt);

      expect(authService.getCurrentUser).toHaveBeenCalledWith(
        mockUserId.toString(),
      );
      expect(result).toEqual({
        _id: mockUserId.toString(),
        email: mockUser.email,
        roles: expect.any(Array),
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('googleAuthCallback', () => {
    it('should handle Google OAuth callback', async () => {
      authService.loginWithGoogle.mockResolvedValue(mockTokens);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(authService.loginWithGoogle).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback',
      );
    });
  });

  describe('facebookAuthCallback', () => {
    it('should handle Facebook OAuth callback', async () => {
      authService.loginWithFacebook.mockResolvedValue(mockTokens);

      await controller.facebookAuthCallback(mockRequest, mockResponse);

      expect(authService.loginWithFacebook).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback',
      );
    });
  });

  describe('googleAuth', () => {
    it('should initiate Google OAuth flow', async () => {
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  describe('facebookAuth', () => {
    it('should initiate Facebook OAuth flow', async () => {
      const result = await controller.facebookAuth();
      expect(result).toBeUndefined();
    });
  });
});
