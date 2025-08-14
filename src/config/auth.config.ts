// src/config/auth.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET ?? 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID ?? '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL ?? '',
  },
  redirectUrlAfterLogin:
    process.env.REDIRECT_URL_AFTER_LOGIN ??
    'http://localhost:3000/auth/callback',
}));
