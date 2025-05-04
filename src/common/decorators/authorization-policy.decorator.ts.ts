// src/common/decorators/authorization-policy.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Privilege, Action } from '../enums/permission.enum';

export interface AccessControl {
  privilege: Privilege;
  action: Action;
}

export const ACCESS_CONTROL_KEY = 'access_control';

export const AccessControls = (...policies: AccessControl[]) =>
  SetMetadata(ACCESS_CONTROL_KEY, policies);
