import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Socket } from 'socket.io';

@Catch()
export class WebSocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'Internal server error';

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception
    ) {
      message = (exception as { message: string }).message;
    }

    client.emit('error', {
      message,
      socketId: client.id,
      timestamp: new Date().toISOString(),
      msgId: randomUUID(),
    });
  }
}
