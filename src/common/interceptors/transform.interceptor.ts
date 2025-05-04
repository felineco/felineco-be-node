// src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response as ExpressResponse } from 'express';
import { PagingResponse } from '../dtos/page-response.dto';
import { instanceToPlain } from 'class-transformer';

export interface Response<T> {
  data: T;
  meta?: any;
  statusCode: number;
  timestamp: string;
}

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
