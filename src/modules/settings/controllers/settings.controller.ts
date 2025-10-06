// src/modules/settings/controllers/settings.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppLoggerService } from 'src/common/services/logger.service';
import { BackendConfigResponseDto } from '../dtos/responses/settings-response.dto';
import { SettingsService } from '../services/settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private logger: AppLoggerService,
  ) {
    this.logger.setContext(SettingsController.name);
  }

  @Get('backend-config')
  async getSettings(): Promise<BackendConfigResponseDto> {
    return await this.settingsService.getBackendConfig();
  }
}
