// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import * as os from 'os';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  //  @Auth({
  //     privilege: Privilege.USER,
  //     action: Action.MANAGE,
  //   })
  @Get()
  @HealthCheck()
  check() {
    // Get system-appropriate path for disk check
    const diskPath = this.getDiskPath();

    return this.health.check([
      // Check database connection
      () => this.db.pingCheck('database', { timeout: 5000 }),

      // Check memory usage
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB

      // Check disk usage with platform-specific path
      () =>
        this.disk.checkStorage('disk', {
          path: diskPath,
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * Get appropriate disk path based on operating system
   */
  private getDiskPath(): string {
    // Check if Windows
    if (os.platform() === 'win32') {
      // Use C: drive for Windows
      return 'C:\\';
    }

    // Use root directory for Unix/Linux/macOS
    return '/';
  }
}
