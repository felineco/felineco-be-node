// src/modules/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('auth.google.clientId') ?? '',
      clientSecret: configService.get<string>('auth.google.clientSecret') ?? '',
      callbackURL: configService.get<string>('auth.google.callbackUrl') ?? '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user: User | false) => void,
  ): Promise<void> {
    try {
      const { emails, id } = profile;

      if (!emails || emails.length === 0) {
        return done(new Error('No email found from Google profile'), false);
      }

      const email = emails[0].value;

      // Try to find or create a user with this email
      const user = await this.authService.validateOrCreateGoogleUser({
        email,
        googleId: id,
      });

      return done(null, user);
    } catch (error) {
      // Type assertion to Error since we know it's an error
      done(error instanceof Error ? error : new Error(String(error)), false);
    }
  }
}
