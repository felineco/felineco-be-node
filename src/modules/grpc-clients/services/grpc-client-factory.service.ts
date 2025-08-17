// src/modules/grpc-clients/services/grpc-client-factory.service.ts
import { ChannelCredentials, credentials } from '@grpc/grpc-js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientGrpc,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { join } from 'path';

@Injectable()
export class GrpcClientFactory {
  private readonly grpcUrl: string;
  constructor(private configService: ConfigService) {
    this.grpcUrl =
      this.configService.get<string>('grpc.url') ?? 'localhost:50051';
  }

  createClient(packageName: string, protoFileName: string): ClientGrpc {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: packageName,
        protoPath: join(__dirname, protoFileName),
        url: this.grpcUrl,
        credentials: this.getCredentials(),
      },
    }) as ClientGrpc;
  }

  private getCredentials(): ChannelCredentials {
    const grpcUrl =
      this.configService.get<string>('grpc.url') ?? 'localhost:50051';

    // If using secure domain, use SSL credentials
    if (
      grpcUrl.includes(':443') ||
      (!grpcUrl.includes('localhost') && !grpcUrl.match(/^\d+\.\d+\.\d+\.\d+/))
    ) {
      return credentials.createSsl();
    }

    // For local development, use insecure credentials
    return credentials.createInsecure();
  }
}
