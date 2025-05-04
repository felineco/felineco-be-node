// src/common/services/common-services.module.ts
import { Global, Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerService } from './logger.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CryptoService, AppLoggerService],
  exports: [CryptoService, AppLoggerService],
})
export class CommonServicesModule {}
