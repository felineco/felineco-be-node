// src/modules/auth/interfaces/jwt-payload.interface.ts
import { AccessControl } from 'src/common/decorators/authorization-policy.decorator.ts';

export interface JwtPayload {
  sub: string;
  permissions: AccessControl[];
}

// Define an interface for the refresh token payload
export interface RefreshTokenPayload {
  sub: string;
  tokenType: string;
  iat: number;
  exp: number;
}
