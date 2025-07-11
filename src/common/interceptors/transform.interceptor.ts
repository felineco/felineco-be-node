// src/common/interceptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../dtos/common-response.dto';
import { PagingResponse } from '../dtos/page-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const now = new Date().toISOString();
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();

    return next.handle().pipe(
      map((data: any) => {
        // Check if the response is a PageDto
        if (data instanceof PagingResponse) {
          // Extract data and meta from PageDto
          return {
            data: instanceToPlain(data.data) as unknown as T,
            meta: data.meta,
            statusCode: response.statusCode,
            timestamp: now,
          };
        }
        // Regular response
        return {
          data: instanceToPlain(data) as T,
          statusCode: response.statusCode,
          timestamp: now,
        };
      }),
    );
  }
}
