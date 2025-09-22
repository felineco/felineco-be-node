// src/modules/ai-assistants/gateways/ai-assistants.gateway.ts
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Server } from 'socket.io';
import { ACCESS_TOKEN_COOKIE_NAME } from 'src/common/constants/cookie-names.constant';
import {
  WsHandlerReturnInterface,
  WsResponse,
} from 'src/common/dtos/ws-response.dto';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { AudioMessage } from 'src/common/interfaces/audio-message.interface';
import { AppLoggerService } from 'src/common/services/logger.service';
import { GeminiService } from 'src/modules/ai-services/services/gemini.service';
import { AudioProcessingService } from 'src/modules/audio/services/audio-processing.service';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { QueueService } from 'src/modules/queue/services/queue.service';
import { SessionsService } from 'src/modules/sessions/services/sessions.service';
import { UsersService } from 'src/modules/users/services/users.service';
import { WebSocketExceptionFilter } from '../../../common/filters/websocket-exception.filter';
import { WebSocketResponseInterceptor } from '../../../common/interceptors/websocket-response.interceptor';
import { sampleNoteFields } from '../constants/sample-template.constant';
import { AudioChunkWsDto } from '../dtos/requests/audio-chunk-ws.dto';
import { WsInitializeDto } from '../dtos/responses/ws-initialize.dto';
import {
  AssistantWsEventRequestEnum,
  AssistantWsEventResponseEnum,
  SyncEventBroadcastEnum,
} from '../enums/assistant-ws-event.enum';
import { RoomNameEnum } from '../enums/room-name.enum';
import {
  OngoingAudioTranscription,
  OutputField,
  UploadedAudio,
  UploadedImage,
  UserModel,
} from '../interfaces/models.interface';
import { CustomSocket } from '../interfaces/socket.interface';

@UseFilters(WebSocketExceptionFilter)
@UseInterceptors(WebSocketResponseInterceptor)
@WebSocketGateway({
  namespace: 'ws/ai-assistants',
  cors: {
    origin: '*', //FIXME: Configure this properly for production
  },
})
export class AiAssistantsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly audioOverlapLength: number;
  private userModelMap: Map<string, UserModel> = new Map();

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly queueService: QueueService,
    private readonly geminiService: GeminiService,
    private readonly audioProcessingService: AudioProcessingService,
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AiAssistantsGateway.name);
    this.userModelMap = new Map();

    this.audioOverlapLength =
      this.configService.get<number>(
        'ai.transcriptionConfig.audioOverlapLength',
      ) ?? 5;

    // Clean up orphaned user models every 1 hour
    setInterval(
      () => {
        void this.cleanupOrphanedUserModels();
      },
      1 * 1000 * 60 * 60, // 1 hour
    );
  }

  async handleConnection(client: CustomSocket) {
    // Access headers from handshake
    const headers = client.handshake.headers;

    // Extract Bearer token from headers
    const authHeader = headers.authorization;
    // Extract the cookie if needed
    const cookie = headers.cookie;
    // Extract the token from either the header or cookie
    let token: string | undefined;
    if (authHeader !== undefined && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookie !== undefined) {
      const cookieToken = cookie
        .split('; ')
        .find((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`));
      token = cookieToken === undefined ? undefined : cookieToken.split('=')[1];
    }

    // Validate the token
    if (token !== undefined) {
      const payload = await this.authService.validateToken(token);
      if (payload !== null) {
        // Send session ID to client
        client.emit(AssistantWsEventResponseEnum.SESSION_CREATED, {
          socketId: client.id,
          timestamp: new Date().toISOString(),
          msgId: randomUUID(),
        } as WsResponse<{}>);

        // Store userId in socket data for later cleanup
        client.data.userId = payload.sub;

        // Check if the room is empty
        const room = this.getRoomMap().get(payload.sub) ?? new Set();

        if (room.size === 0) {
          // Extra safety check to avoid overwriting existing user model
          if (this.userModelMap.has(payload.sub))
            throw new Error(
              'User model is not properly cleaned up even when room is empty - memory leak likely',
            );
          // Room is empty, create a new user model for that user
          // Get user details and session template from database
          const user = await this.usersService.findOne(payload.sub);
          const userLanguage = user.language ?? LanguageEnum.EN_US;
          // Get session templates for the user's language
          const templates = await this.sessionsService.findAllTemplates([
            userLanguage,
          ]);
          const template = templates.length > 0 ? templates[0] : null;
          // Create note fields from template or use empty map
          const noteFieldsMap = new Map<number, OutputField>();
          if (template !== null) {
            template.fields.forEach((field) => {
              noteFieldsMap.set(field.id as number, {
                id: field.id as number,
                label: field.label,
                value: field.value,
                guide: field.guide,
                sample: field.sample,
                order: field.order,
              });
            });
          } else {
            // If no template is found, use the sample note fields
            sampleNoteFields.forEach((field) => {
              noteFieldsMap.set(field.id, { ...field });
            });
          }

          // Create a consumer tag for analysis trigger
          const analysisTriggerConsumerTag =
            await this.queueService.consumeAnalysisTrigger(
              payload.sub,
              (id: string) => this.analyzeUserModelData(id),
            );

          // Create and store the user model
          const userModel: UserModel = {
            images: new Map(),
            audios: new Map(),
            ongoingTranscriptions: new Map(),
            noteFields: noteFieldsMap,
            reminderFields: new Map(),
            warningFields: new Map(),
            analysisTriggerConsumerTag,
            language: userLanguage,
          };

          this.userModelMap.set(payload.sub, userModel);
        }
        // Room exists, send the existing user model (for both new and existing users)
        const existingUserModel = this.userModelMap.get(payload.sub);
        if (existingUserModel === undefined) {
          this.logger.error(
            `User model not found for userId: ${payload.sub} - disconnecting client`,
          );
          client.disconnect();
          return;
        }
        // Convert Maps to Arrays for serialization
        const serializedUserModel = {
          images: Array.from(existingUserModel.images.values()),
          audios: Array.from(existingUserModel.audios.values()),
          noteFields: Array.from(existingUserModel.noteFields.values()),
          reminderFields: Array.from(existingUserModel.reminderFields.values()),
          warningFields: Array.from(existingUserModel.warningFields.values()),
        };

        client.emit(SyncEventBroadcastEnum.INITIALIZE, {
          data: serializedUserModel,
          socketId: client.id,
          timestamp: new Date().toISOString(),
          msgId: randomUUID(),
        } as WsResponse<WsInitializeDto>);

        // Add client to a room for broadcasting (based on user ID)
        await client.join(payload.sub);
        // Add to a notifications room
        await client.join(RoomNameEnum.GENERAL_NOTIFICATIONS);

        return;
      }
    }

    // If authentication fails, emit an error and disconnect
    client.emit(AssistantWsEventResponseEnum.ERROR, {
      message: 'Authentication required',
      socketId: client.id,
      timestamp: new Date().toISOString(),
      msgId: randomUUID(),
    } as WsResponse<{ message: string }>);
    client.disconnect();
    return;
  }

  async handleDisconnect(client: CustomSocket) {
    // Clean up user model if the user has no active connections to avoid memory leaks
    const userId = client.data.userId;
    if (userId !== undefined) {
      // Leave the room first
      await client.leave(userId);
      await client.leave(RoomNameEnum.GENERAL_NOTIFICATIONS);
      // Check if the room is empty => user has disconnected from all devices
      const room = this.getRoomMap().get(userId);
      if (!room || room.size === 0) {
        await this.clearUserModelWithId(userId);
      }
    }
    // Signal to the client that the session is closed
    client.emit(AssistantWsEventResponseEnum.SESSION_CLOSED, {
      socketId: client.id,
      timestamp: new Date().toISOString(),
      msgId: randomUUID(),
    } as WsResponse<{}>);
  }

  @SubscribeMessage(AssistantWsEventRequestEnum.PING)
  async handlePing(): Promise<WsHandlerReturnInterface<string>> {
    return {
      event: AssistantWsEventResponseEnum.PONG,
      data: 'pong',
    };
  }

  @SubscribeMessage(AssistantWsEventRequestEnum.AUDIO_CHUNK)
  async handleAudioChunk(
    @ConnectedSocket() client: CustomSocket,
    @MessageBody() data: AudioChunkWsDto,
  ): Promise<WsHandlerReturnInterface<void>> {
    const userId = client.data.userId;
    if (userId === undefined) {
      this.logger.error(
        `Received audio chunk from unauthenticated client: ${client.id}`,
      );
      throw new Error('UserId not found in socket data');
    }
    const audioBuffer = Buffer.from(data.chunk, 'base64');

    // If this is the first audio chunk, initialize the ongoingTranscription
    const ongoingTranscriptions =
      this.userModelMap.get(userId)?.ongoingTranscriptions;

    if (ongoingTranscriptions === undefined) {
      this.logger.error(
        `Ongoing transcriptions map not found for userId: ${userId} when receiving audio chunk - logic error`,
      );
      throw new Error('Ongoing transcriptions map not found');
    }

    if (data.order === 1) {
      // Initialize the subscriber
      if (ongoingTranscriptions.has(data.id)) {
        this.logger.error(
          `Ongoing transcription already exists for audio id: ${data.id} when receiving first audio chunk - logic error`,
        );
        throw new Error(
          `Ongoing transcription already exists for audio id: ${data.id} when receiving first audio chunk - logic error`,
        );
      }
      // Create user specific rabbitmq queue if it doesn't exist
      const consumerTag = await this.queueService.consumeAudioChunk(
        userId,
        data.id,
        (
          userId,
          audioId,
          audioInfos: { audioChunk: Buffer; audioMessage: AudioMessage }[],
        ) => this.receiveAndProcessAudioChunk(userId, audioId, audioInfos),
      );
      const ongoingAudioTranscription: OngoingAudioTranscription = {
        id: data.id,
        currentFullTranscription: '',
        currentFullTranscriptionFromLargeChunks: '',
        transcriptionConsumerTag: consumerTag,
      };
      ongoingTranscriptions.set(data.id, ongoingAudioTranscription);
    }

    await this.queueService.publishAudioChunk(audioBuffer, {
      id: data.id,
      order: data.order,
      isLargeChunk: data.isLargeChunk,
      userId,
    });

    return {
      event: AssistantWsEventResponseEnum.AUDIO_CHUNK_RECEIVED,
    };
  }

  addImagesToUserModel(
    userId: string,
    images: UploadedImage[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      images.forEach((image) => userModel.images.set(image.id, image));
    }

    this.broadcastMessage<UploadedImage[]>({
      data: images,
      event: SyncEventBroadcastEnum.ADD_IMAGES,
      roomId: userId,
      originSocketId,
    });
  }

  deleteImagesFromUserModel(
    userId: string,
    imageIds: string[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      imageIds.forEach((imageId) => userModel.images.delete(imageId));
    }
    this.broadcastMessage<string[]>({
      data: imageIds,
      event: SyncEventBroadcastEnum.DELETE_IMAGES,
      roomId: userId,
      originSocketId,
    });
  }

  addAudiosToUserModel(
    userId: string,
    audios: UploadedAudio[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      audios.forEach((audio) => {
        userModel.audios.set(audio.id, audio);
        // Special logic: clear the ongoing transcription if exists (REPLACE THE ONGOING TRANSCRIPTION WITH THE FINAL ONE IF THERE ID IS DUPLICATED)
        if (userModel.ongoingTranscriptions.has(audio.id)) {
          userModel.ongoingTranscriptions.delete(audio.id);
        }
      });
    }

    this.broadcastMessage<UploadedAudio[]>({
      data: audios,
      event: SyncEventBroadcastEnum.ADD_AUDIOS,
      roomId: userId,
      originSocketId,
    });
  }

  deleteAudiosFromUserModel(
    userId: string,
    audioIds: string[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      audioIds.forEach((audioId) => userModel.audios.delete(audioId));
    }

    this.broadcastMessage<string[]>({
      data: audioIds,
      event: SyncEventBroadcastEnum.DELETE_AUDIOS,
      roomId: userId,
      originSocketId,
    });
  }

  updateNotesInUserModel(
    userId: string,
    notes: OutputField[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      notes.forEach((field) => {
        userModel.noteFields.set(field.id, field);
      });
    }
    this.broadcastMessage<OutputField[]>({
      data: notes,
      event: SyncEventBroadcastEnum.UPDATE_NOTE_FIELDS,
      roomId: userId,
      originSocketId,
    });
  }

  updateRemindersInUserModel(
    userId: string,
    reminderFields: OutputField[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      reminderFields.forEach((field) => {
        userModel.reminderFields.set(field.id, field);
      });
    }

    this.broadcastMessage<OutputField[]>({
      data: reminderFields,
      event: SyncEventBroadcastEnum.UPDATE_REMINDER_FIELDS,
      roomId: userId,
      originSocketId,
    });
  }

  updateWarningsInUserModel(
    userId: string,
    warningFields: OutputField[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      warningFields.forEach((field) => {
        userModel.warningFields.set(field.id, field);
      });
    }

    this.broadcastMessage<OutputField[]>({
      data: warningFields,
      event: SyncEventBroadcastEnum.UPDATE_WARNING_FIELDS,
      roomId: userId,
      originSocketId,
    });
  }

  deleteFieldsFromUserModel(
    userId: string,
    fieldIds: number[],
    originSocketId: string = '',
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      fieldIds.forEach((fieldId) => {
        userModel.noteFields.delete(fieldId);
        userModel.reminderFields.delete(fieldId);
        userModel.warningFields.delete(fieldId);
      });
    }

    this.broadcastMessage<number[]>({
      data: fieldIds,
      event: SyncEventBroadcastEnum.DELETE_FIELDS,
      roomId: userId,
      originSocketId,
    });
  }

  getUserModel(userId: string): UserModel | undefined {
    return this.userModelMap.get(userId);
  }

  getUserLanguage(userId: string): LanguageEnum {
    const userModel = this.getUserModel(userId);
    return userModel?.language ?? LanguageEnum.EN_US;
  }

  private async receiveAndProcessAudioChunk(
    userId: string,
    audioId: string,
    audioInfos: { audioChunk: Buffer; audioMessage: AudioMessage }[],
  ): Promise<void> {
    // Get user model
    const userModel = this.userModelMap.get(userId);
    const ongoingTranscription = userModel?.ongoingTranscriptions.get(audioId);

    if (userModel === undefined) {
      this.logger.error(
        `Logic error - user model not found for userId: ${userId}`,
      );
      throw new Error(
        `Logic error - user model not found for userId: ${userId}`,
      );
    }

    if (ongoingTranscription === undefined) {
      this.logger.error(
        `Logic error - ongoing transcription not found for userId: ${userId} and audioMessage.id: ${audioId}`,
      );
      throw new Error(
        `Logic error - ongoing transcription not found for userId: ${userId} and audioMessage.id: ${audioId}`,
      );
    }

    // Build the data for audio processing
    const base64AudioDataForLargeChunks: {
      id: string;
      base64Audios: string;
    }[] = [];

    let lastIndex = -1;

    for (const [index, audioInfo] of audioInfos.entries()) {
      if (audioInfo.audioMessage.isLargeChunk) {
        base64AudioDataForLargeChunks.push({
          id: audioInfo.audioMessage.id,
          base64Audios: audioInfo.audioChunk.toString('base64'),
        });
        lastIndex = index;
      }
    }

    const combinedBase64AudioDataForLargeChunks =
      await this.audioProcessingService.combineBase64AudioChunks(
        base64AudioDataForLargeChunks,
        this.audioOverlapLength,
      );

    if (combinedBase64AudioDataForLargeChunks !== '') {
      // Main processing - transcribe the audio chunk
      const transcriptionResult =
        await this.geminiService.transcribeAudioSegments(
          combinedBase64AudioDataForLargeChunks,
          ongoingTranscription.currentFullTranscriptionFromLargeChunks,
          userModel.language,
        );
      // Update the ongoing transcription with the new transcription
      ongoingTranscription.currentFullTranscription =
        transcriptionResult.fullTranscription;
      ongoingTranscription.currentFullTranscriptionFromLargeChunks =
        transcriptionResult.fullTranscription;
      // Trigger the analysis after processing a large chunk
      void this.queueService.publishAnalysisTrigger(userId);
    }

    // Process the remaining audio chunks (NON-LARGE or after the last large chunk)
    if (
      (lastIndex >= 0 && lastIndex < audioInfos.length - 1) ||
      lastIndex === -1
    ) {
      const remainingAudioInfosAndLargeChunks = audioInfos.slice(lastIndex + 1);
      // Perform transcription of remaining chunks
      const base64AudioData = remainingAudioInfosAndLargeChunks.map((info) => ({
        id: info.audioMessage.id,
        base64Audios: info.audioChunk.toString('base64'),
      }));
      // Trim the first few seconds if not the first chunk to avoid overlapping content and combine the audios
      const combinedBase64Audio =
        await this.audioProcessingService.combineBase64AudioChunks(
          base64AudioData,
          this.audioOverlapLength,
        );

      // Main processing - transcribe the audio chunk
      const transcriptionResult =
        await this.geminiService.transcribeAudioSegments(
          combinedBase64Audio,
          ongoingTranscription.currentFullTranscription,
          userModel.language,
        );
      // Update the ongoing transcription with the new transcription
      ongoingTranscription.currentFullTranscription =
        transcriptionResult.fullTranscription;
    }
  }

  private async analyzeUserModelData(userId: string): Promise<void> {
    const userModel = this.userModelMap.get(userId);
    if (userModel === undefined) {
      this.logger.error(
        `Logic error - user model not found for userId: ${userId} when triggering analysis`,
      );
      throw new Error(
        `Logic error - user model not found for userId: ${userId} when triggering analysis`,
      );
    }
    const result = await this.geminiService.analyzeUserModel(userModel);
    // Update the user model with new fields
    this.updateNotesInUserModel(userId, result.noteFields);
    this.updateRemindersInUserModel(userId, result.reminderFields);
    this.updateWarningsInUserModel(userId, result.warningFields);
  }

  public broadcastMessage<T>({
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
    this.server
      .to(roomId) // Send to the user's room
      .emit(event, response);
  }

  private getRoomMap(): Map<string, Set<string>> {
    // Get the room map from the adapter: roomId (mostly userId) -> Set of socketIds
    // HACK: Someone need to make a PR to the socket.io library :)))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this.server.adapter as any).rooms;
  }

  private async cleanupOrphanedUserModels() {
    this.logger.log('Cleaning up orphaned user models');
    for (const [userId] of this.userModelMap) {
      const room = this.getRoomMap().get(userId);
      if (!room || room.size === 0) {
        await this.clearUserModelWithId(userId);
        this.logger.warn(
          `Removed orphaned user model for userId: ${userId} - check memory leaks`,
        );
      }
    }
  }

  private async clearUserModelWithId(userId: string): Promise<void> {
    if (this.userModelMap.has(userId)) {
      // Delete the consumerTag first
      const userModel = this.userModelMap.get(userId);
      if (userModel === undefined) {
        return;
      }
      const ongoingTranscriptions = userModel.ongoingTranscriptions;
      if (ongoingTranscriptions !== undefined) {
        for (const [, ongoingTranscription] of ongoingTranscriptions) {
          await this.queueService.cancelConsumer(
            ongoingTranscription.transcriptionConsumerTag,
          );
        }
      }
      const analysisTriggerConsumerTag = userModel.analysisTriggerConsumerTag;
      await this.queueService.cancelConsumer(analysisTriggerConsumerTag);

      // Then delete the user model
      this.userModelMap.delete(userId);
    }
  }
}
