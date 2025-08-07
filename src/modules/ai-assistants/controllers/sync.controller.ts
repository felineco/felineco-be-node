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
import { SyncEventBroadcastEnum } from '../enums/assistant-ws-event.enum';
import { RoomNameEnum } from '../enums/room-name.enum';
import { AiAssistantsGateway } from '../gateways/ai-assistants.gateway';

import { AddAudiosDto } from '../dtos/requests/add-audios.dto';
import { AddImagesDto } from '../dtos/requests/add-images.dto';
import { DeleteAudiosDto } from '../dtos/requests/delete-audios.dto';
import { DeleteFieldsDto } from '../dtos/requests/delete-fields.dto';
import { DeleteImagesDto } from '../dtos/requests/delete-images.dto';
import { UpdateFieldsDto } from '../dtos/requests/update-fields.dto';
import {
  OutputField,
  UploadedAudio,
  UploadedImage,
} from '../interfaces/models.interface';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly aiAssistantsGateway: AiAssistantsGateway) {}

  // TODO: This is a sample working endpoint for testing purposes.
  @Auth()
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    this.broadcastMessage<string>({
      data: sendMessageDto.message,
      event: SyncEventBroadcastEnum.PONG,
      roomId: req.user.sub,
      originSocketId: sendMessageDto.socketId,
    });

    return;
  }

  @Auth()
  @Post('notes/update')
  @HttpCode(HttpStatus.OK)
  async updateNoteFields(
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const notes: OutputField[] = updateFieldsDto.fields;
    this.aiAssistantsGateway.updateNotesInUserModel(req.user.sub, notes);

    this.broadcastMessage<OutputField[]>({
      data: notes,
      event: SyncEventBroadcastEnum.UPDATE_NOTE_FIELDS,
      roomId: req.user.sub,
      originSocketId: updateFieldsDto.socketId,
    });
  }

  @Auth()
  @Post('reminders/update')
  @HttpCode(HttpStatus.OK)
  async updateReminderFields(
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const notes: OutputField[] = updateFieldsDto.fields;
    this.aiAssistantsGateway.updateRemindersInUserModel(req.user.sub, notes);

    this.broadcastMessage<OutputField[]>({
      data: notes,
      event: SyncEventBroadcastEnum.UPDATE_REMINDER_FIELDS,
      roomId: req.user.sub,
      originSocketId: updateFieldsDto.socketId,
    });
  }

  @Auth()
  @Post('warnings/update')
  @HttpCode(HttpStatus.OK)
  async updateWarningFields(
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const notes: OutputField[] = updateFieldsDto.fields;
    this.aiAssistantsGateway.updateWarningsInUserModel(req.user.sub, notes);

    this.broadcastMessage<OutputField[]>({
      data: notes,
      event: SyncEventBroadcastEnum.UPDATE_WARNING_FIELDS,
      roomId: req.user.sub,
      originSocketId: updateFieldsDto.socketId,
    });
  }

  @Auth()
  @Post('fields/delete')
  @HttpCode(HttpStatus.OK)
  async deleteFields(
    @Body() deleteFieldsDto: DeleteFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const noteIds: number[] = deleteFieldsDto.fields.map((field) => field.id);
    this.aiAssistantsGateway.deleteFieldsFromUserModel(req.user.sub, noteIds);

    this.broadcastMessage<number[]>({
      data: noteIds,
      event: SyncEventBroadcastEnum.DELETE_FIELDS,
      roomId: req.user.sub,
      originSocketId: deleteFieldsDto.socketId,
    });
  }

  @Auth()
  @Post('images/add')
  @HttpCode(HttpStatus.OK)
  async addImages(
    @Body() addImagesDto: AddImagesDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const images: UploadedImage[] = addImagesDto.images;
    this.aiAssistantsGateway.addImagesToUserModel(req.user.sub, images);

    this.broadcastMessage<UploadedImage[]>({
      data: images,
      event: SyncEventBroadcastEnum.ADD_IMAGES,
      roomId: req.user.sub,
      originSocketId: addImagesDto.socketId,
    });
  }

  @Auth()
  @Post('images/delete')
  @HttpCode(HttpStatus.OK)
  async deleteImages(
    @Body() deleteImagesDto: DeleteImagesDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const imageIds: string[] = deleteImagesDto.images.map((image) => image.id);
    this.aiAssistantsGateway.deleteImagesFromUserModel(req.user.sub, imageIds);

    this.broadcastMessage<string[]>({
      data: imageIds,
      event: SyncEventBroadcastEnum.DELETE_IMAGES,
      roomId: req.user.sub,
      originSocketId: deleteImagesDto.socketId,
    });
  }

  @Auth()
  @Post('audios/add')
  @HttpCode(HttpStatus.OK)
  async addAudios(
    @Body() addAudiosDto: AddAudiosDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const audios: UploadedAudio[] = addAudiosDto.audios;
    this.aiAssistantsGateway.addAudiosToUserModel(req.user.sub, audios);

    this.broadcastMessage<UploadedAudio[]>({
      data: audios,
      event: SyncEventBroadcastEnum.ADD_AUDIOS,
      roomId: req.user.sub,
      originSocketId: addAudiosDto.socketId,
    });
  }

  @Auth()
  @Post('audios/delete')
  @HttpCode(HttpStatus.OK)
  async deleteAudios(
    @Body() deleteAudiosDto: DeleteAudiosDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const audioIds: string[] = deleteAudiosDto.audios.map((audio) => audio.id);
    this.aiAssistantsGateway.deleteAudiosFromUserModel(req.user.sub, audioIds);

    this.broadcastMessage<string[]>({
      data: audioIds,
      event: SyncEventBroadcastEnum.DELETE_AUDIOS,
      roomId: req.user.sub,
      originSocketId: deleteAudiosDto.socketId,
    });
  }

  private broadcastMessage<T>({
    data,
    event = SyncEventBroadcastEnum.PONG,
    roomId = RoomNameEnum.GENERAL_NOTIFICATIONS,
    originSocketId = '',
  }: {
    data: T;
    event?: SyncEventBroadcastEnum;
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
