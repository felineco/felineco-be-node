// src/common/decorators/authorization-policy.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Operation, Privilege } from '../enums/permission.enum';

export interface AccessControl {
  privilege: Privilege;
  operation: Operation;
}

export const ACCESS_CONTROL_KEY = 'access_control';

export const AccessControls = (...policies: AccessControl[]) =>
  SetMetadata(ACCESS_CONTROL_KEY, policies);
