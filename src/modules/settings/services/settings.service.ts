// src/modules/settings/services/settings.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SettingsService {
  constructor(private readonly configService: ConfigService) {}

  async getBackendConfig(): Promise<{
    audio: {
      overlapLength: number;
      audioSegmentToOverlapLengthRatio: number;
      bigChunkCycle: number;
    };
  }> {
    return {
      audio: {
        overlapLength:
          this.configService.get<number>(
            'ai.transcriptionConfig.audioOverlapLength',
          ) ?? 5,
        audioSegmentToOverlapLengthRatio:
          this.configService.get<number>(
            'ai.transcriptionConfig.audioSegmentToOverlapLengthRatio',
          ) ?? 1,
        bigChunkCycle:
          this.configService.get<number>(
            'ai.transcriptionConfig.audioBigChunkCycle',
          ) ?? 10,
      },
    };
  }
}
