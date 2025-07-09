// src/modules/auth/strategies/facebook.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { UserWithPopulateRoleAndPermission } from 'src/modules/users/schemas/user.schema';
import { AuthService } from '../services/auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('auth.facebook.clientId') ?? '',
      clientSecret:
        configService.get<string>('auth.facebook.clientSecret') ?? '',
      callbackURL: configService.get<string>('auth.facebook.callbackUrl') ?? '',
      scope: ['email'],
      profileFields: ['id', 'emails', 'name'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (
      err: Error | null,
      user: UserWithPopulateRoleAndPermission | false,
    ) => void,
  ): Promise<void> {
    try {
      const { emails, id } = profile;

      if (!emails || emails.length === 0) {
        return done(new Error('No email found from Facebook profile'), false);
      }

      const email = emails[0].value;

      // Try to find or create a user with this email
      const user = await this.authService.validateOrCreateFacebookUser({
        email,
        facebookId: id,
      });

      return done(null, user);
    } catch (error) {
      done(error instanceof Error ? error : new Error(String(error)), false);
    }
  }
}
