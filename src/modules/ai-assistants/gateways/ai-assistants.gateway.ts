// src/modules/ai-assistants/gateways/ai-assistants.gateway.ts
import { UseFilters, UseInterceptors } from '@nestjs/common';
import {
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
import { AppLoggerService } from 'src/common/services/logger.service';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { WebSocketExceptionFilter } from '../../../common/filters/websocket-exception.filter';
import { WebSocketResponseInterceptor } from '../../../common/interceptors/websocket-response.interceptor';
import { WsInitializeDto } from '../dtos/responses/ws-initialize.dto';
import {
  AssistantWsEventRequestEnum,
  AssistantWsEventResponseEnum,
  SyncEventBroadcastEnum,
} from '../enums/assistant-ws-event.enum';
import { RoomNameEnum } from '../enums/room-name.enum';
import {
  OutputField,
  UploadedAudio,
  UploadedImage,
  UserModel,
} from '../interfaces/models.interface';
import { CustomSocket } from '../interfaces/socket.interface';

// Sample data
const sampleNoteFields: OutputField[] = [
  {
    id: 1,
    label: 'Diagnosis',
    value: '',
    guide: "Provide a detailed description of the patient's condition.",
    sample:
      'Feline asthma, presenting with intermittent coughing and mild respiratory distress.',
  },
  {
    id: 2,
    label: 'Treatment Plan',
    value: '',
    guide: 'Outline the recommended treatment plan for the patient.',
    sample:
      'Initiate inhaled corticosteroids (Fluticasone 110mcg BID via AeroKat chamber). Consider adding bronchodilator if symptoms persist.',
  },
  {
    id: 3,
    label: 'Follow-up',
    value: '',
    guide: 'Describe the recommended follow-up schedule and monitoring.',
    sample:
      'Recheck in 2 weeks to assess response to therapy and adjust medications as needed.',
  },
  {
    id: 4,
    label: 'Owner Instructions',
    value: '',
    guide:
      'List instructions for the owner regarding home care and monitoring.',
    sample:
      'Monitor for coughing, wheezing, or increased respiratory effort. Ensure proper inhaler technique.',
  },
  {
    id: 5,
    label: 'Medications',
    value: '',
    guide: 'List all prescribed medications and their dosages.',
    sample:
      'Fluticasone 110mcg BID via inhaler. Albuterol as rescue inhaler if acute symptoms develop.',
  },
  {
    id: 6,
    label: 'Dietary Recommendations',
    value: '',
    guide: 'Provide dietary advice or restrictions if applicable.',
    sample:
      'Continue current diet. Consider hypoallergenic diet if symptoms do not improve.',
  },
  {
    id: 7,
    label: 'Environmental Modifications',
    value: '',
    guide: 'Suggest any environmental changes to help the patient.',
    sample:
      'Minimize exposure to dust, smoke, and aerosols. Use air purifiers if possible.',
  },
];

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

  private userModelMap: Map<string, UserModel> = new Map();

  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AiAssistantsGateway.name);
    this.userModelMap = new Map();

    // Clean up orphaned user models every 1 hour
    setInterval(
      () => {
        this.cleanupOrphanedUserModels();
      },
      1 * 1000 * 60 * 60,
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
          // Room is empty, create a new user model for that user
          const userModel: UserModel = {
            images: new Map(),
            audios: new Map(),
            noteFields: new Map(
              sampleNoteFields.map((field) => [field.id, { ...field }]),
            ),
            reminderFields: new Map(),
            warningFields: new Map(),
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
      // Check if the room is empty
      const room = this.getRoomMap().get(userId);
      if (!room || room.size === 0) {
        this.userModelMap.delete(userId);
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

  private getRoomMap(): Map<string, Set<string>> {
    // HACK: Someone need to make a PR to the socket.io library :)))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (this.server.adapter as any).rooms;
  }

  private cleanupOrphanedUserModels() {
    this.logger.log('Cleaning up orphaned user models');
    for (const [userId] of this.userModelMap) {
      const room = this.getRoomMap().get(userId);
      if (!room || room.size === 0) {
        this.userModelMap.delete(userId);
        this.logger.warn(
          `Removed orphaned user model for userId: ${userId} - check memory leaks`,
        );
      }
    }
  }

  addImagesToUserModel(userId: string, images: UploadedImage[]): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      images.forEach((image) => userModel.images.set(image.id, image));
    }
  }

  deleteImagesFromUserModel(userId: string, imageIds: string[]): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      imageIds.forEach((imageId) => userModel.images.delete(imageId));
    }
  }

  addAudiosToUserModel(userId: string, audios: UploadedAudio[]): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      audios.forEach((audio) => userModel.audios.set(audio.id, audio));
    }
  }

  deleteAudiosFromUserModel(userId: string, audioIds: string[]): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      audioIds.forEach((audioId) => userModel.audios.delete(audioId));
    }
  }

  updateNotesInUserModel(userId: string, notes: OutputField[]): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      notes.forEach((field) => {
        userModel.noteFields.set(field.id, field);
      });
    }
  }

  updateRemindersInUserModel(
    userId: string,
    reminderFields: OutputField[],
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      // Set reminder fields to the new map
      userModel.reminderFields = new Map(
        reminderFields.map((field) => [field.id, field]),
      );
    }
  }

  updateWarningsInUserModel(
    userId: string,
    warningFields: OutputField[],
  ): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      // Set warning fields to the new map
      userModel.warningFields = new Map(
        warningFields.map((field) => [field.id, field]),
      );
    }
  }

  deleteFieldsFromUserModel(userId: string, fieldIds: number[]): void {
    const userModel = this.userModelMap.get(userId);
    if (userModel) {
      fieldIds.forEach((fieldId) => {
        userModel.noteFields.delete(fieldId);
        userModel.reminderFields.delete(fieldId);
        userModel.warningFields.delete(fieldId);
      });
    }
  }

  getUserModel(userId: string): UserModel | undefined {
    return this.userModelMap.get(userId);
  }
}
