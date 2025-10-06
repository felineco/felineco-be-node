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
import { Auth } from 'src/common/decorators/auth.decorator';
import { RequestWithJwtPayload } from 'src/modules/auth/interfaces/jwt-request.interface';
import { SendMessageDto } from '../dtos/requests/send-message.dto';
import { SyncEventBroadcastEnum } from '../enums/assistant-ws-event.enum';
import { AiAssistantsGateway } from '../gateways/ai-assistants.gateway';

import { AppLoggerService } from 'src/common/services/logger.service';
import { GeminiService } from 'src/modules/ai-services/services/gemini.service';
import { OpenAIService } from 'src/modules/ai-services/services/openai.service';
import { QueueService } from 'src/modules/queue/services/queue.service';
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
  constructor(
    private readonly aiAssistantsGateway: AiAssistantsGateway,
    private readonly openAIService: OpenAIService,
    private readonly geminiService: GeminiService,
    private readonly queueService: QueueService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SyncController.name);
  }

  // @Auth()
  // @Post('analyze-image')
  // @HttpCode(HttpStatus.OK)
  // async analyzeImageWithOpenAI(
  //   @Body() body: { imageUrl: string },
  // ): Promise<{ analysis: string; tokensUsed: number }> {
  //   const analysis = await this.openAIService.analyzeImages(body.imageUrl);

  //   return {
  //     analysis: analysis.description,
  //     tokensUsed: analysis.tokensUsed ?? 0,
  //   };
  // }

  // @Auth()
  // @Post('transcribe-audio')
  // @HttpCode(HttpStatus.OK)
  // async transcribeAudio(
  //   @Body() body: { audioBase64: string; previousTranscript: string },
  // ): Promise<string> {
  //   const transcription = await this.geminiService.transcribeAudio(
  //     body.audioBase64,
  //     body.previousTranscript,
  //   );

  //   return transcription;
  // }

  // @Auth()
  // @Post('transcribe-audio')
  // @HttpCode(HttpStatus.OK)
  // async transcribeAudio(
  //   @Body() body: { url: string },
  // ): Promise<{ transcription: string; tokensUsed?: number }> {
  //   const transcription = await this.geminiService.transcribeWholeAudio(
  //     body.url,
  //   );

  // TODO: This is a sample working endpoint for testing purposes.
  @Auth()
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    this.aiAssistantsGateway.broadcastMessage<string>({
      data: sendMessageDto.message,
      event: SyncEventBroadcastEnum.PONG,
      roomId: req.user.sub,
      originSocketId: sendMessageDto.socketId,
    });

    return;
  }

  @Auth()
  @Post('images/add')
  @HttpCode(HttpStatus.OK)
  async addImages(
    @Body() addImagesDto: AddImagesDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const images: UploadedImage[] = addImagesDto.images.map((image) => ({
      id: image.id,
      url: image.url,
      aiAnalysis: '', // Empty string will trigger the analysis
    }));

    void this.aiAssistantsGateway.addImagesToUserModel(req.user.sub, images);
  }

  @Auth()
  @Post('images/delete')
  @HttpCode(HttpStatus.OK)
  async deleteImages(
    @Body() deleteImagesDto: DeleteImagesDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const imageIds: string[] = deleteImagesDto.images.map((image) => image.id);
    void this.aiAssistantsGateway.deleteImagesFromUserModel(
      req.user.sub,
      imageIds,
    );
  }

  @Auth()
  @Post('audios/add')
  @HttpCode(HttpStatus.OK)
  async addAudios(
    @Body() addAudiosDto: AddAudiosDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const audios: UploadedAudio[] = addAudiosDto.audios.map((audio) => ({
      id: audio.id,
      url: audio.url,
      duration: audio.duration,
      transcription: '', // Placeholder for transcription result
    }));

    // Initially add audios without transcription for immediate response
    void this.aiAssistantsGateway.addAudiosToUserModel(req.user.sub, audios);
  }

  @Auth()
  @Post('audios/delete')
  @HttpCode(HttpStatus.OK)
  async deleteAudios(
    @Body() deleteAudiosDto: DeleteAudiosDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const audioIds: string[] = deleteAudiosDto.audios.map((audio) => audio.id);
    void this.aiAssistantsGateway.deleteAudiosFromUserModel(
      req.user.sub,
      audioIds,
    );
  }

  @Auth()
  @Post('notes/update')
  @HttpCode(HttpStatus.OK)
  async updateNoteFields(
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const notes: OutputField[] = updateFieldsDto.fields;
    void this.aiAssistantsGateway.updateNotesInUserModel(req.user.sub, notes);
  }

  @Auth()
  @Post('reminders/update')
  @HttpCode(HttpStatus.OK)
  async updateReminderFields(
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const notes: OutputField[] = updateFieldsDto.fields;
    void this.aiAssistantsGateway.updateRemindersInUserModel(
      req.user.sub,
      notes,
    );
  }

  @Auth()
  @Post('warnings/update')
  @HttpCode(HttpStatus.OK)
  async updateWarningFields(
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const notes: OutputField[] = updateFieldsDto.fields;
    void this.aiAssistantsGateway.updateWarningsInUserModel(
      req.user.sub,
      notes,
    );
  }

  @Auth()
  @Post('fields/delete')
  @HttpCode(HttpStatus.OK)
  async deleteFields(
    @Body() deleteFieldsDto: DeleteFieldsDto,
    @Req() req: RequestWithJwtPayload,
  ): Promise<void> {
    const noteIds: number[] = deleteFieldsDto.fields.map((field) => field.id);
    void this.aiAssistantsGateway.deleteFieldsFromUserModel(
      req.user.sub,
      noteIds,
    );
  }
}
