// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ACCESS_TOKEN_COOKIE_NAME } from 'src/common/constants/cookie-names.constant';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from Authorization Bearer header => TURN OFF FOR NOW
        // ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try to extract from cookies
        (request: Request): string | null => {
          if (request === undefined || request?.cookies === undefined) {
            return null;
          }

          const result = (
            request?.cookies as Record<string, string | undefined>
          )[ACCESS_TOKEN_COOKIE_NAME];
          return typeof result === 'string' ? result : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwt.secret') ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return {
      sub: payload.sub,
      permissions: payload.permissions,
    } as JwtPayload;
  }
}
