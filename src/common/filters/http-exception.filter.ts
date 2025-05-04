// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../services/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Handle cases when the message is string or array
    let message = exception.message;
    const responseContent = exception.getResponse();
    if (typeof responseContent === 'object' && responseContent !== null) {
      if (
        'message' in responseContent &&
        Array.isArray(responseContent.message)
      ) {
        message = responseContent.message.join('; ');
      } else if (
        'message' in responseContent &&
        typeof responseContent.message === 'string'
      ) {
        message = responseContent.message;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      error: exception.name,
    };

    // Log the error with appropriate level based on status code
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}: ${message}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status}: ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
