// src/common/logger/logger.service.ts
import {
  ConsoleLogger,
  Injectable,
  LoggerService,
  Scope,
  LogLevel,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { defaultLogLevels } from 'src/config/constants/default-log-level';
import { ENV } from 'src/config/constants/environment.enum';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;
  private logger: ConsoleLogger;
  private readonly logLevels: LogLevel[];
  private readonly maxObjectSize: number;

  constructor(@Inject(ConfigService) private configService?: ConfigService) {
    this.logLevels =
      this.configService?.get<LogLevel[]>('logging.levels') ??
      defaultLogLevels[ENV.DEVELOPMENT];
    this.maxObjectSize =
      this.configService?.get<number>('logging.options.maxObjectSize') ?? 1000;

    this.logger = new ConsoleLogger();
    this.logger.setLogLevels(this.logLevels);
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: any, contextOverride?: string) {
    if (typeof message === 'object') {
      message = this.formatObject(message);
    }
    this.logger.log(message, contextOverride ?? this.context);
  }

  error(message: any, trace?: string, contextOverride?: string) {
    if (typeof message === 'object') {
      message = this.formatObject(message);
    }
    this.logger.error(message, trace, contextOverride ?? this.context);
  }

  warn(message: any, contextOverride?: string) {
    if (typeof message === 'object') {
      message = this.formatObject(message);
    }
    this.logger.warn(message, contextOverride ?? this.context);
  }

  debug(message: any, contextOverride?: string) {
    if (typeof message === 'object') {
      message = this.formatObject(message);
    }
    this.logger.debug(message, contextOverride ?? this.context);
  }

  verbose(message: any, contextOverride?: string) {
    if (typeof message === 'object') {
      message = this.formatObject(message);
    }
    this.logger.verbose(message, contextOverride ?? this.context);
  }

  // Helper to format objects and limit their size
  private formatObject(obj: any): string {
    try {
      const stringified = JSON.stringify(obj, null, 2);
      if (stringified.length > this.maxObjectSize) {
        return stringified.substring(0, this.maxObjectSize) + '... [truncated]';
      }
      return stringified;
    } catch {
      return '[Object could not be stringified]';
    }
  }
}
