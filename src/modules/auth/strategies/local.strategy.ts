// src/modules/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { IStrategyOptions, Strategy } from 'passport-local';
import { UserWithPopulateRoleAndPermission } from 'src/modules/users/schemas/user.schema';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    } as IStrategyOptions);
  }

  async validate(
    email: string,
    password: string,
  ): Promise<UserWithPopulateRoleAndPermission> {
    const user = await this.authService.validateUser(email, password);

    if (user === null || user === undefined) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
