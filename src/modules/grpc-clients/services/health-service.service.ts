// src/modules/grpc-clients/services/health-service.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientGrpc,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';
import { map, Observable } from 'rxjs';
import { HealthService } from '../interfaces/health.interface';
import { GrpcMetadataService } from './grpc-metadata.service';

@Injectable()
export class GRPCHealthService implements OnModuleInit {
  private client: ClientGrpc;
  private healthService: HealthService;

  constructor(
    private configService: ConfigService,
    private grpcMetadataService: GrpcMetadataService,
  ) {}

  onModuleInit() {
    // Create the client with config values
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'health',
        protoPath: join(__dirname, '../proto/health/health.proto'),
        url: this.configService.get<string>('grpc.url') ?? 'localhost:50051',
      },
    }) as ClientGrpc;

    // Get the HealthService from the client
    this.healthService = this.client.getService<HealthService>('HealthService');
  }

  health(): Observable<string> {
    return this.healthService.health({}).pipe(map((res) => res.message));
  }

  healthWithAuthentication(): Observable<string> {
    return this.healthService
      .healthWithAuthentication(
        {},
        this.grpcMetadataService.metaDataWithApiKey(),
      )
      .pipe(map((res) => res.message));
  }
}
