// src/modules/ai-assistants/controllers/ai-assistants.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { Auth } from 'src/common/decorators/auth.decorator';
import { WsResponse } from 'src/common/dtos/ws-response.dto';
import { RequestWithJwtPayload } from 'src/modules/auth/interfaces/jwt-request.interface';
import { SendMessageDto } from '../dtos/requests/send-message.dto';
import { AssistantWsEventBroadcastEnum } from '../enums/assistant-ws-event.enum';
import { RoomNameEnum } from '../enums/room-name.enum';
import { AiAssistantsGateway } from '../gateways/ai-assistants.gateway';

@ApiTags('AI Assistants')
@Controller('ai-assistants')
export class InputSyncController {
  constructor(private readonly aiAssistantsGateway: AiAssistantsGateway) {}

  @Auth()
  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    // Mock AI processing
    const aiResponse = `Mock AI response to: "${sendMessageDto.message}"`;

    this.broadcastMessage<string>({
      data: aiResponse,
      event: AssistantWsEventBroadcastEnum.PONG,
      roomId: req.user.sub,
      originSocketId: sendMessageDto.message,
    });

    return;
  }

  private broadcastMessage<T>({
    data,
    event = AssistantWsEventBroadcastEnum.PONG,
    roomId = RoomNameEnum.GENERAL_NOTIFICATIONS,
    originSocketId = '',
  }: {
    data: T;
    event?: AssistantWsEventBroadcastEnum;
    roomId?: string;
    originSocketId?: string;
  }): void {
    // Declare the response structure
    const response: WsResponse<T> = {
      data,
      socketId: originSocketId,
      timestamp: new Date().toISOString(),
      msgId: randomUUID(),
    };

    // Send response via WebSocket to all connected clients
    this.aiAssistantsGateway.server
      .to(roomId) // Send to the user's room
      .emit(event, response);
  }
}
