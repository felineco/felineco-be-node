// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GRPCHealthService } from '../grpc-clients/services/health-service.service';

@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor(private grpcHealthService: GRPCHealthService) {}

  @Get()
  check() {
    return this.grpcHealthService.healthWithAuthentication();
  }
}
