// src/modules/auth/guards/authorization-policy.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ACCESS_CONTROL_KEY,
  AccessControl,
} from 'src/common/decorators/authorization-policy.decorator.ts';
import { Operation } from 'src/common/enums/permission.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required policies from route metadata
    const requiredPolicies = this.reflector.getAllAndOverride<AccessControl[]>(
      ACCESS_CONTROL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no policies required, allow access
    if (requiredPolicies.length === 0) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context
      .switchToHttp()
      .getRequest<{ user: JwtPayload | undefined }>();
    const user = request.user;

    if (user === undefined) {
      return false;
    }
    // Create a set of user permission strings
    const userPermissionSet = new Set<string>();

    // Process user permissions
    if (Array.isArray(user.permissions)) {
      user.permissions.forEach((perm: AccessControl) => {
        if ('privilege' in perm && 'operation' in perm) {
          const privilege = perm.privilege;
          const operation = perm.operation;

          // Add the specific permission
          userPermissionSet.add(`${privilege}:${operation}`);

          // If this is a 'manage' action, add all other actions for this privilege
          if (operation === Operation.MANAGE) {
            Object.values(Operation).forEach((act) => {
              userPermissionSet.add(`${privilege}:${act}`);
            });
          }
        }
      });
    }

    const result = requiredPolicies.some((policy) => {
      const permission = `${policy.privilege}:${policy.operation}`;
      return userPermissionSet.has(permission);
    });

    return result;
  }
}
