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
import { Auth } from 'src/common/decorators/auth.decorator';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { AppLoggerService } from 'src/common/services/logger.service';
import { OpenAIService } from 'src/modules/ai-services/services/openai.service';
import { RequestWithJwtPayload } from 'src/modules/auth/interfaces/jwt-request.interface';
import { GRPCNoteGenerationService } from 'src/modules/grpc-clients/services/note-generation-service.service';
import { GRPCTranscriptionService } from 'src/modules/grpc-clients/services/transcription-service.service';
import { QueueService } from 'src/modules/queue/services/queue.service';
import { UsersService } from 'src/modules/users/services/users.service';
import { ExtractOutputFieldsDto } from '../dtos/requests/extract-output-fields.dto';
import { AiAssistantsGateway } from '../gateways/ai-assistants.gateway';
import { OutputField } from '../interfaces/models.interface';

@ApiTags('AI Assistant')
@Controller('ai-assistant')
export class AiAssistantsController {
  constructor(
    private readonly aiAssistantsGateway: AiAssistantsGateway,
    private readonly grpcTranscriptionService: GRPCTranscriptionService,
    private readonly grpcNoteGenerationService: GRPCNoteGenerationService,
    private readonly usersService: UsersService,
    private readonly openAIService: OpenAIService,
    private readonly queueService: QueueService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AiAssistantsController.name);
  }

  // FIXME: This endpoint request to the AI server which is currently too slow
  // A new endpoint is created so this should be removed later
  @Auth()
  @Post('generate-notes')
  @HttpCode(HttpStatus.OK)
  async generateNotes(@Req() req: RequestWithJwtPayload): Promise<void> {
    const userId = req.user.sub;

    void this.queueService.publishAnalysisTrigger(userId);
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
    // Get language from user models
    const language = userModel.language ?? LanguageEnum.EN_US;
    // Extract the new output fields using OpenAI
    this.openAIService
      .extractOutputFields(extractOutputFieldsDto.imageUrls, language)
      .then((extractFieldsResponse) => {
        // Create new note fields from extracted fields with unique IDs
        let maxId = -1;

        userModel.noteFields.forEach((outputField) => {
          if (outputField.id > maxId) {
            maxId = outputField.id;
          }
        });
        userModel.reminderFields.forEach((outputField) => {
          if (outputField.id > maxId) {
            maxId = outputField.id;
          }
        });
        userModel.warningFields.forEach((outputField) => {
          if (outputField.id > maxId) {
            maxId = outputField.id;
          }
        });

        const newNoteFields: OutputField[] =
          extractFieldsResponse.outputFields.map((field, index) => {
            const order = maxId + 1 + index;
            return {
              id: order,
              label: field.label ?? '',
              value: '', // Initially empty, will be filled when generating notes
              guide: field.guide ?? '',
              sample: '', // Could be enhanced to include sample from gRPC response if available
              order: order,
            };
          });

        // Add new fields to user model
        this.aiAssistantsGateway.updateNotesInUserModel(userId, newNoteFields);
        // Handle the gRPC response
        return extractFieldsResponse;
      })
      .catch((error) => {
        // Log here as the error won't be caught by global handler
        if (error instanceof Error) {
          this.logger.error(
            `[${req.method}] ${req.url} - Status: 500 - Unhandled Error: ${error.message}`,
            error.stack,
          );
        }
        this.logger.error(`An error occurred: ${JSON.stringify(error)}`);
      });
  }
}
