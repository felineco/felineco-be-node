// src/modules/auth/controllers/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { RequestWithUser } from '../interfaces/local-request.interface';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { AuthTokenInterface } from '../interfaces/auth-token.interface';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: RequestWithUser): Promise<AuthTokenInterface> {
    return await this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthTokenInterface> {
    return await this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This route initiates the Google OAuth flow
    // The guard will handle redirection to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: RequestWithUser) {
    // After successful Google authentication, create JWT tokens
    const tokens = await this.authService.loginWithGoogle(req.user);
    return tokens;
  }
}
