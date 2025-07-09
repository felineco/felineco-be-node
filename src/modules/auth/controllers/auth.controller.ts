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
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config/dist/config.service';
import { ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from 'src/config/constants/cookie-names';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { FacebookAuthGuard } from '../guards/facebook-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthTokenInterface } from '../interfaces/auth-token.interface';
import { RequestWithUser } from '../interfaces/local-request.interface';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  readonly isCookieSecure: boolean;
  readonly redirectUrlAfterLogin: string;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.redirectUrlAfterLogin =
      this.configService.get<string>('auth.redirectUrlAfterLogin') ??
      'http://localhost:3000/auth/callback';
    this.isCookieSecure =
      this.configService.get<string>('app.environment') === 'production';
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokenInterface> {
    const tokens = await this.authService.login(req.user);

    this.setCookies(res, tokens);

    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: ExpressRequest,
  ): Promise<AuthTokenInterface> {
    // Extract refresh token from cookies
    const refreshToken = (req?.cookies as Record<string, string | undefined>)?.[
      REFRESH_TOKEN_COOKIE_NAME
    ];

    let tokens: AuthTokenInterface;

    if (refreshToken !== undefined && refreshToken.length > 0) {
      tokens = await this.authService.refreshToken(refreshToken);
    } else if (
      refreshTokenDto.refreshToken !== undefined &&
      refreshTokenDto.refreshToken.length > 0
    ) {
      tokens = await this.authService.refreshToken(
        refreshTokenDto.refreshToken,
      );
    } else {
      throw new UnauthorizedException('Refresh token is required');
    }

    this.setCookies(res, tokens);

    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    this.clearCookies(res);
    return;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // This route initiates the Google OAuth flow
    // The guard will handle redirection to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    // After successful Google authentication, create JWT tokens
    const tokens = await this.authService.loginWithGoogle(req.user);

    this.setCookies(res, tokens);

    res.redirect(this.redirectUrlAfterLogin);
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    // This route initiates the Facebook OAuth flow
    // The guard will handle redirection to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    // After successful Facebook authentication, create JWT tokens
    const tokens = await this.authService.loginWithFacebook(req.user);

    this.setCookies(res, tokens);

    res.redirect(this.redirectUrlAfterLogin);
  }

  private setCookies(res: Response, tokens: AuthTokenInterface) {
    // Set access token cookie
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure: this.isCookieSecure,
      sameSite: 'strict',
      expires: new Date(tokens.accessTokenExpiresAt),
    });

    // Set refresh token cookie
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: this.isCookieSecure,
      sameSite: 'strict',
      expires: new Date(tokens.refreshTokenExpiresAt),
    });
  }

  private clearCookies(res: Response) {
    // Clear access token cookie
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isCookieSecure,
      sameSite: 'strict',
    });

    // Clear refresh token cookie
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isCookieSecure,
      sameSite: 'strict',
    });
  }
}
