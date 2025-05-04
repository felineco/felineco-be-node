// src/common/decorators/auth.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { AccessControlGuard } from '../../modules/auth/guards/access-control.guard';
import {
  AccessControls,
  AccessControl,
} from './authorization-policy.decorator.ts';

export function Auth(...policies: AccessControl[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, AccessControlGuard),
    AccessControls(...policies),
    ApiBearerAuth(),
  );
}
