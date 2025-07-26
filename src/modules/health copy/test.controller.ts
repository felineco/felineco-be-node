// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { GRPCHealthService } from '../grpc-clients/services/health-service.service';

@ApiTags('Test')
@Controller('test')
export class HealthController {
  constructor(private grpcHealthService: GRPCHealthService) {}

  @Get('/')
  async test(): Promise<string> {
    return await firstValueFrom(this.grpcHealthService.health());
  }
}
