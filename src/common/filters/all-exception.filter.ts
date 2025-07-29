// src/common/filters/http-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../dtos/error-response.dto';
import { AppLoggerService } from '../services/logger.service';

@Catch() // No parameters means catch all exceptions
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code - default to 500 if not an HttpException
    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract message
    let message = 'Internal server error due to Unhandled Error';
    if (exception instanceof Error) {
      message = `Unhandled Error: ${exception.message}`;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
    } as ErrorResponse);
  }
}
