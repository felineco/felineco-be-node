import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Socket } from 'socket.io';
import {
  WsHandlerReturnInterface,
  WsResponse,
} from 'src/common/dtos/ws-response.dto';

@Injectable()
export class WebSocketResponseInterceptor<T>
  implements NestInterceptor<T, WsResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<WsResponse<T>> {
    const client = context.switchToWs().getClient<Socket>();

    return next.handle().pipe(
      map((response: WsHandlerReturnInterface<T>) => {
        // Add common fields to every response
        return {
          data: response.data,
          message: response.message,
          event: response.event,
          socketId: client.id,
          timestamp: new Date().toISOString(),
          msgId: randomUUID(),
        } as WsResponse<T>;
      }),
    );
  }
}
