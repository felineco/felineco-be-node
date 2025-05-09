// src/modules/auth/interfaces/auth-token.interface.ts
export interface AuthTokenInterface {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date | number; // ISO timestamp or Unix timestamp
  refreshTokenExpiresAt: Date | number;
}
