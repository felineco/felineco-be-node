import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from 'src/common/services/crypto.service';
import {
  User,
  UserWithPopulateRoleAndPermission,
} from 'src/modules/users/schemas/user.schema';
import { UsersService } from '../../users/services/users.service';
import { AuthTokenInterface } from '../interfaces/auth-token.interface';
import {
  JwtPayload,
  RefreshTokenPayload,
} from '../interfaces/jwt-payload.interface';

// Add this interface inside your file
interface GoogleUserInfo {
  email: string;
  googleId: string;
}

@Injectable()
export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cryptoService: CryptoService,
  ) {
    this.jwtSecret = this.configService.get<string>('auth.jwt.secret') ?? '';
    if (!this.jwtSecret) {
      throw new BadRequestException('JWT secret is not configured');
    }
    this.jwtExpiresIn =
      this.configService.get<string>('auth.jwt.expiresIn') ?? '15m';
    this.jwtRefreshExpiresIn =
      this.configService.get<string>('auth.jwt.refreshExpiresIn') ?? '7d';
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithPopulateRoleAndPermission> {
    let user: UserWithPopulateRoleAndPermission;
    try {
      user = await this.usersService.findByEmail(email);
    } catch (error: any) {
      // Check if the error is a BadRequestException
      if (error instanceof BadRequestException) {
        throw new UnauthorizedException(error);
      }
      throw error;
    }
    const isPasswordValid = await this.cryptoService.comparePasswords(
      password,
      user.hashPassword,
    );

    if (isPasswordValid) {
      return user;
    }
    throw new UnauthorizedException('Wrong password');
  }

  async login(
    user: UserWithPopulateRoleAndPermission,
  ): Promise<AuthTokenInterface> {
    return this.generateTokens(user._id.toString());
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenInterface> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.jwtSecret,
        },
      );

      // Check if this is a refresh token
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Generate new tokens using user ID from the refresh token
      return this.generateTokens(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      // Verify the token
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtSecret,
      });
      return payload;
    } catch {
      // If token is invalid or expired, return null
      return null;
    }
  }

  async getCurrentUser(
    userId: string,
  ): Promise<UserWithPopulateRoleAndPermission> {
    return this.usersService.findOne(userId);
  }

  async updateProfile(
    userId: string,
    updateData: Partial<User> & { password?: string },
  ): Promise<UserWithPopulateRoleAndPermission> {
    return this.usersService.update(userId, updateData);
  }

  // New method to validate Google users
  async validateOrCreateGoogleUser(
    userInfo: GoogleUserInfo,
  ): Promise<UserWithPopulateRoleAndPermission> {
    try {
      // Try to find an existing user with this email
      const existingUser = await this.usersService.findByEmail(userInfo.email);
      return existingUser;
    } catch {
      // User doesn't exist, create a new one
      // Generate a random password for the user (they will never use it directly)
      const randomPassword = await this.cryptoService.randomPassword();

      // Create new user
      await this.usersService.create({
        email: userInfo.email,
        password: randomPassword, // This will be hashed by the users service
        // You might want to assign default roles here
      });

      return this.usersService.findByEmail(userInfo.email);
    }
  }
  // New method to validate Facebook users
  async validateOrCreateFacebookUser(userInfo: {
    email: string;
    facebookId: string;
  }): Promise<UserWithPopulateRoleAndPermission> {
    try {
      // Try to find an existing user with this email
      const existingUser = await this.usersService.findByEmail(userInfo.email);
      return existingUser;
    } catch {
      // User doesn't exist, create a new one
      // Generate a random password for the user (they will never use it directly)
      const randomPassword = await this.cryptoService.randomPassword();

      // Create new user
      await this.usersService.create({
        email: userInfo.email,
        password: randomPassword,
        // You might want to assign default roles here
      });
      return await this.usersService.findByEmail(userInfo.email);
    }
  }

  // Method to create tokens for Google-authenticated user
  async loginWithGoogle(
    user: UserWithPopulateRoleAndPermission,
  ): Promise<AuthTokenInterface> {
    // Reuse your existing token generation functionality
    return this.generateTokens(user._id.toString());
  }

  // Method to create tokens for Facebook-authenticated user
  async loginWithFacebook(
    user: UserWithPopulateRoleAndPermission,
  ): Promise<AuthTokenInterface> {
    // Reuse your existing token generation functionality
    return this.generateTokens(user._id.toString());
  }

  private async generateTokens(userId: string): Promise<AuthTokenInterface> {
    // Get permissions for the user
    const jwtPayload = await this.usersService.getUserJwtPayload(userId);

    // Get token expiration settings
    const accessTokenExpiresIn = this.jwtExpiresIn;
    const refreshTokenExpiresIn = this.jwtRefreshExpiresIn;

    // Calculate expiration timestamps
    const accessTokenExpiresAt =
      this.calculateExpirationDate(accessTokenExpiresIn);
    const refreshTokenExpiresAt = this.calculateExpirationDate(
      refreshTokenExpiresIn,
    );

    // Prepare payload for access token
    const secret = this.jwtSecret;

    // Generate access token
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret,
      expiresIn: accessTokenExpiresIn,
    });

    // Generate refresh token with longer expiry and different payload
    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenType: 'refresh' },
      {
        secret,
        expiresIn: refreshTokenExpiresIn,
      },
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  private calculateExpirationDate(duration: string): Date {
    // Parse duration like '1d', '7d', '15m', etc.
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 1 day if format is invalid
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = new Date();

    switch (unit) {
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 's':
        return new Date(now.getTime() + value * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 1 day
    }
  }
}
