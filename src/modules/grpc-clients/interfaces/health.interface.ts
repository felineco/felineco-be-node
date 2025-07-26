// src/modules/grpc/interfaces/health.interface.ts

import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export interface HealthRequest {
  // Empty message - no fields
}

export interface HealthResponse {
  message: string;
}

export interface HealthService {
  health(request: HealthRequest): Observable<HealthResponse>;
  healthWithAuthentication(
    request: HealthRequest,
    metadata?: Metadata,
  ): Observable<HealthResponse>;
}
