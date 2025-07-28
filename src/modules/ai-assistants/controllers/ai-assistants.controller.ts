// src/modules/ai-assistants/controllers/ai-assistants.controller.ts
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Auth } from 'src/common/decorators/auth.decorator';
import { WsResponse } from 'src/common/dtos/ws-response.dto';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { RequestWithJwtPayload } from 'src/modules/auth/interfaces/jwt-request.interface';
import { GRPCNoteGenerationService } from 'src/modules/grpc-clients/services/note-generation-service.service';
import { GRPCTranscriptionService } from 'src/modules/grpc-clients/services/transcription-service.service';
import { ExtractOutputFieldsDto } from '../dtos/requests/extract-output-fields.dto';
import { SyncEventBroadcastEnum } from '../enums/assistant-ws-event.enum';
import { RoomNameEnum } from '../enums/room-name.enum';
import { AiAssistantsGateway } from '../gateways/ai-assistants.gateway';
import { OutputField } from '../interfaces/models.interface';

@ApiTags('AI Assistant')
@Controller('ai-assistant')
export class AiAssistantsController {
  constructor(
    private readonly aiAssistantsGateway: AiAssistantsGateway,
    private readonly grpcTranscriptionService: GRPCTranscriptionService,
    private readonly grpcNoteGenerationService: GRPCNoteGenerationService,
  ) {}

  @Auth()
  @Post('generate-notes')
  @HttpCode(HttpStatus.OK)
  async generateNotes(@Req() req: RequestWithJwtPayload): Promise<void> {
    const userId = req.user.sub;

    // Get user model from WebSocket gateway
    const userModel = this.aiAssistantsGateway.getUserModel(userId);
    if (!userModel) {
      throw new InternalServerErrorException(
        `User model not found. Please contact developers. This error
        might be caused by a ws session not started properly.`,
      );
    }

    // Step 1: Transcribe audio files if any
    let audioTranscriptions: string[] = [];
    if (userModel.audios.size > 0) {
      const audioUrls = Array.from(userModel.audios.values()).map(
        (audio) => audio.url,
      );
      const transcriptionResponse = await firstValueFrom(
        this.grpcTranscriptionService.transcribeAudio({
          audio_urls: audioUrls,
          instruction: 'Transcribe the audio content',
          language: LanguageEnum.VI_VN, // FIXME: Use user language preference
        }),
      );
      audioTranscriptions = transcriptionResponse.audio_transcriptions;
    }

    // Step 2: Generate notes using images and transcriptions
    const imageUrls = Array.from(userModel.images.values()).map(
      (image) => image.url,
    );
    const noteFields = Array.from(userModel.noteFields.values()).map(
      (field) => ({
        id: field.id,
        label: field.label,
        guide: field.guide,
        sample: field.sample,
      }),
    );

    const generateNotesResponse = await firstValueFrom(
      this.grpcNoteGenerationService.generateNotes({
        note_fields: noteFields,
        image_urls: imageUrls,
        audio_transcriptions: audioTranscriptions,
        prompt: '',
        language: LanguageEnum.VI_VN, // FIXME: Use user language preference
      }),
    );

    // Step 3: Update user model with generated notes
    const updatedNotes: OutputField[] = generateNotesResponse.note_fields.map(
      (noteField) => {
        const existingField = userModel.noteFields.get(noteField.id);
        if (existingField === undefined) {
          return {
            id: noteField.id,
            label: noteField.label,
            value: noteField.value,
            guide: '',
            sample: '',
          };
        }
        return {
          id: noteField.id,
          label: noteField.label,
          value: noteField.value,
          guide: existingField.guide,
          sample: existingField.sample,
        } as OutputField;
      },
    );

    const reminderFields: OutputField[] =
      generateNotesResponse.reminder_fields.map((reminderField) => ({
        id: reminderField.id,
        label: reminderField.label,
        value: reminderField.value,
        guide: '',
        sample: '',
      }));
    const warningFields: OutputField[] =
      generateNotesResponse.warning_fields.map((warningField) => ({
        id: warningField.id,
        label: warningField.label,
        value: warningField.value,
        guide: '',
        sample: '',
      }));

    this.aiAssistantsGateway.updateNotesInUserModel(userId, updatedNotes);
    this.aiAssistantsGateway.updateRemindersInUserModel(userId, reminderFields);
    this.aiAssistantsGateway.updateWarningsInUserModel(userId, warningFields);

    // Step 4: Broadcast the updated notes to all connected clients
    this.broadcastMessage<OutputField[]>({
      data: updatedNotes,
      event: SyncEventBroadcastEnum.UPDATE_NOTE_FIELDS,
      roomId: userId,
      originSocketId: 'broadcast',
    });
    this.broadcastMessage<OutputField[]>({
      data: reminderFields,
      event: SyncEventBroadcastEnum.UPDATE_REMINDER_FIELDS,
      roomId: userId,
      originSocketId: 'broadcast',
    });
    this.broadcastMessage<OutputField[]>({
      data: warningFields,
      event: SyncEventBroadcastEnum.UPDATE_WARNING_FIELDS,
      roomId: userId,
      originSocketId: 'broadcast',
    });
  }

  @Auth()
  @Post('extract-output-fields')
  @HttpCode(HttpStatus.OK)
  async extractOutputFields(
    @Body() extractOutputFieldsDto: ExtractOutputFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const userId = req.user.sub;

    // Get user model from WebSocket gateway
    const userModel = this.aiAssistantsGateway.getUserModel(userId);
    if (!userModel) {
      throw new InternalServerErrorException(
        `User model not found. Please contact developers. This error
        might be caused by a ws session not started properly.`,
      );
    }

    // Extract output fields using gRPC
    const extractFieldsResponse = await firstValueFrom(
      this.grpcNoteGenerationService.extractOutputFields({
        image_urls: extractOutputFieldsDto.imageUrls,
        prompt: '',
        language: LanguageEnum.VI_VN, // FIXME: Use user language preference
      }),
    );

    // Create new note fields from extracted fields with unique IDs
    const existingIds = Array.from(userModel.noteFields.keys());
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : -1;
    const newNoteFields: OutputField[] =
      extractFieldsResponse.output_fields.map((field, index) => {
        return {
          id: maxId + 1 + index,
          label: field.label,
          value: '', // Initially empty, will be filled when generating notes
          guide: field.guide,
          sample: '', // Could be enhanced to include sample from gRPC response if available
        } as OutputField;
      });

    // Add new fields to user model
    this.aiAssistantsGateway.updateNotesInUserModel(userId, newNoteFields);

    // Broadcast the new fields to all connected clients
    this.broadcastMessage<OutputField[]>({
      data: newNoteFields,
      event: SyncEventBroadcastEnum.UPDATE_NOTE_FIELDS,
      roomId: userId,
      originSocketId: 'broadcast',
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
