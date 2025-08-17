// src/modules/grpc-clients/services/health-service.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { map, Observable } from 'rxjs';
import { HealthService } from '../interfaces/health.interface';
import { GrpcClientFactory } from './grpc-client-factory.service';
import { GrpcMetadataService } from './grpc-metadata.service';

@Injectable()
export class GRPCHealthService implements OnModuleInit {
  private client: ClientGrpc;
  private healthService: HealthService;

  constructor(
    private configService: ConfigService,
    private grpcMetadataService: GrpcMetadataService,
    private grpcClientFactory: GrpcClientFactory,
  ) {}

  onModuleInit() {
    // Create the client with config values
    this.client = this.grpcClientFactory.createClient(
      'health',
      '../proto/health/health.proto',
    );
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
