// src/modules/ai-services/services/gemini.service.ts
import { GoogleGenAI, Type } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { AppLoggerService } from 'src/common/services/logger.service';
import {
  OutputField,
  UserModel,
} from 'src/modules/ai-assistants/interfaces/models.interface';
import { GeminiModel } from '../enums/gemini-model.enum';

// Define the interface for the ai response
interface AudioSegmentTranscriptionResponse {
  fullTranscription?: string;
  newSegmentTranscription?: string;
}

interface UserModelAnalysisResponse {
  noteFields?: { id?: number; label?: string; value?: string }[];
  reminderFields?: { id?: number; label?: string; value?: string }[];
  warningFields?: { id?: number; label?: string; value?: string }[];
}

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI;

  private audioSegmentTranscriptionResponseSchema = {
    type: Type.OBJECT,
    properties: {
      fullTranscription: {
        type: Type.STRING,
      },
      newSegmentTranscription: {
        type: Type.STRING,
      },
    },
    propertyOrdering: ['fullTranscription', 'newSegmentTranscription'],
  };

  private analysisOutputSchemaItem = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        label: { type: Type.STRING },
        value: { type: Type.STRING },
      },
      required: ['id', 'label', 'value'],
    },
  };

  private analysisOutputSchema = {
    type: Type.OBJECT,
    properties: {
      noteFields: this.analysisOutputSchemaItem,
      reminderFields: this.analysisOutputSchemaItem,
      warningFields: this.analysisOutputSchemaItem,
    },
    required: ['noteFields', 'reminderFields', 'warningFields'],
  };

  private promptTranscribingAudioSegment: string;
  private promptTranscribingWholeAudio: string;
  private promptGeneratingNotes: string;

  constructor(
    private configService: ConfigService,
    private logger: AppLoggerService,
  ) {
    this.logger.setContext(GeminiService.name);
    const apiKey = this.configService.get<string>('ai.googleApiKey') ?? '';
    if (apiKey === '') {
      throw new Error('Google API key is required');
    }

    // const audioOverlapLength = this.configService.getOrThrow<number>(
    //   'ai.transcriptionConfig.audioOverlapLength',
    // );

    this.ai = new GoogleGenAI({ apiKey });

    this.promptTranscribingAudioSegment = `Transcribe doctor-patient conversations in their ORIGINAL LANGUAGE.
      IMPORTANT RULES:
      1. Combine consecutive lines if they are from the same speaker into ONE line
      2. You can edit/correct previous transcription if the new audio provides better context
      3. No timestamps or time markers
      4. Handle overlapping speech by choosing the clearest version
      5. DO NOT REPEAT the same phrases multiple times - transcribe only what is actually said
      6. If audio contains repetitive content, transcribe it only once
      7. The audio may contain no conversation - return empty strings if so
      8. DO NOT MAKE UP ANYTHING or create repetitive content

      STOP repeating phrases. Each line should be transcribed only once.

      The response should have:
      + "fullTranscription": "Complete conversation from start including the new audio segment with speaker labels"
      + "newSegmentTranscription": "Only the new audio transcription after removing any overlap with previous transcription and without speaker labels (just the transcription text)"
      `;

    this.promptTranscribingWholeAudio = `Transcribe this audio, which might be a doctor-patient conversations in their ORIGINAL LANGUAGE.`;
    this.promptGeneratingNotes = `You are a note generation agent for a doctor. You will be given transcriptions which areas likely to be conversations between a doctor and a patient. You will also be given some descriptions (in text) of pictures that the doctor took, mostly about the patient's medical information. Though some transcriptions might not be completed. Given the previous fields, you need to UPDATE NOTE FIELDS for the doctor to fill in the EHR system base on the available information. Please also create/update reminder and warning fields for the doctor if you think there are any things that the doctor should be aware of or any conflicting information or wrong practices from the conversation and images (if you don't have any, generate a general label with value saying there are no reminders or warnings)`;
  }

  async transcribeAudioSegments(
    audioBase64: string,
    previousTranscript: string = '',
    language: LanguageEnum = LanguageEnum.EN_US,
  ): Promise<
    Promise<{
      fullTranscription: string;
      newSegmentTranscription: string;
      tokensUsed?: number;
    }>
  > {
    const contents = [
      { text: this.promptTranscribingAudioSegment },
      { text: `The language of the conversation is likely to be: ${language}` },
      { text: `Previous transcription: ${previousTranscript}` },
      { text: 'New audio segment:' },
      {
        inlineData: {
          mimeType: 'audio/webm', // Audio chunk is always webm from frontend
          data: audioBase64,
        },
      },
    ];

    const aiResponse = await this.ai.models.generateContent({
      model: GeminiModel.GEMINI_2_5_FLASH_LITE,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.audioSegmentTranscriptionResponseSchema,
        temperature: 0,
      },
    });

    // Parse the response text to JSON
    try {
      const parsed = JSON.parse(
        aiResponse.text ?? '{}',
      ) as AudioSegmentTranscriptionResponse;

      return {
        fullTranscription: parsed.fullTranscription ?? previousTranscript,
        newSegmentTranscription: parsed.newSegmentTranscription ?? '',
        tokensUsed: aiResponse.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      // Log the error for debugging
      this.logger.error(error);
      return {
        fullTranscription: previousTranscript,
        newSegmentTranscription: '',
        tokensUsed: aiResponse.usageMetadata?.totalTokenCount,
      };
    }
  }

  async transcribeWholeAudio(
    url: string,
    language: LanguageEnum = LanguageEnum.EN_US,
  ): Promise<{ transcription: string; tokensUsed?: number }> {
    // Download the audio from the URL and convert to base64
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
    }

    // Get MIME type from response headers, fallback to URL extension, then default
    const mimeType =
      response.headers.get('content-type') ?? this.getMimeTypeFromUrl(url);

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

    const contents = [
      { text: this.promptTranscribingWholeAudio },
      { text: `The language of the conversation is likely to be: ${language}` },
      { text: 'Audio:' },
      {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      },
    ];

    const aiResponse = await this.ai.models.generateContent({
      model: GeminiModel.GEMINI_2_5_FLASH_LITE,
      contents,
      config: {
        responseMimeType: 'text/plain',
        temperature: 0,
      },
    });

    return {
      transcription: aiResponse.text ?? '',
      tokensUsed: aiResponse.usageMetadata?.totalTokenCount,
    };
  }

  async analyzeUserModel(userModel: UserModel): Promise<{
    noteFields: OutputField[];
    reminderFields: OutputField[];
    warningFields: OutputField[];
    tokensUsed?: number;
  }> {
    // Transcriptions from audios
    const allTranscriptions: string[] = [];

    for (const [, audio] of userModel.audios) {
      if (audio.transcription) {
        allTranscriptions.push(
          `${allTranscriptions.length + 1}. ${audio.transcription}`,
        );
      }
    }

    for (const [, ongoingTranscription] of userModel.ongoingTranscriptions) {
      if (ongoingTranscription.currentFullTranscription) {
        allTranscriptions.push(
          `${allTranscriptions.length + 1}. ${ongoingTranscription.currentFullTranscription}`,
        );
      }
    }

    // Image description
    const imageDescriptions: string[] = [];
    for (const [, image] of userModel.images) {
      if (image.aiAnalysis) {
        imageDescriptions.push(
          `${imageDescriptions.length + 1}. ${image.aiAnalysis}`,
        );
      }
    }

    // Add field specifications
    const noteFields: string[] = [];
    for (const [, field] of userModel.noteFields) {
      noteFields.push(
        `ID: ${field.id}; Label: ${field.label}; Guide for data in this field: ${field.guide}; A sample of how the output should look like: ${field.sample}; PREVIOUS Value: ${field.value}`,
      );
    }

    const reminderFields: string[] = [];
    for (const [, field] of userModel.reminderFields) {
      reminderFields.push(
        `ID: ${field.id}; Label: ${field.label}; PREVIOUS Value: ${field.value}`,
      );
    }

    const warningFields: string[] = [];
    for (const [, field] of userModel.warningFields) {
      warningFields.push(
        `ID: ${field.id}; Label: ${field.label}; PREVIOUS Value: ${field.value}`,
      );
    }

    const contents = [
      { text: this.promptGeneratingNotes },
      {
        text: 'Here are the conversation transcriptions:',
      },
      { text: allTranscriptions.join('\n') },
      {
        text: 'Here are the image descriptions:',
      },
      { text: imageDescriptions.join('\n') },
      {
        text: 'Here are the previous fields values and their associated data (either filled by user or generated by AI). Please give the updated VALUE for each field below. Use the exact ID and label provided.',
      },
      { text: 'NOTE FIELDS:' },
      { text: noteFields.join('\n') },
      { text: 'REMINDER FIELDS:' },
      { text: reminderFields.join('\n') },
      { text: 'WARNING FIELDS:' },
      { text: warningFields.join('\n') },
    ];

    const aiResponse = await this.ai.models.generateContent({
      model: GeminiModel.GEMINI_2_5_FLASH_LITE,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: this.analysisOutputSchema,
        temperature: 0,
      },
    });

    // Parse the response text to JSON
    try {
      const parsed = JSON.parse(
        aiResponse.text ?? '{}',
      ) as UserModelAnalysisResponse;
      let maxId = -1;
      // Get the max ID from existing fields
      userModel.noteFields.forEach((field) => {
        if (field.id > maxId) {
          maxId = field.id ?? -1;
        }
      });
      userModel.reminderFields.forEach((field) => {
        if (field.id > maxId) {
          maxId = field.id ?? -1;
        }
      });
      userModel.warningFields.forEach((field) => {
        if (field.id > maxId) {
          maxId = field.id ?? -1;
        }
      });

      const noteFields: OutputField[] =
        parsed.noteFields?.map((field) => {
          // Old field to get the label and guide
          let id = field.id ?? ++maxId;
          const oldField = userModel.noteFields.get(id);
          // if oldField is not found id should be the new maxId
          if (!oldField) {
            id = ++maxId;
          }

          return {
            id,
            label: oldField?.label ?? '',
            value: field.value ?? '',
            guide: oldField?.guide ?? '',
            sample: oldField?.sample ?? '',
            order: oldField?.order ?? 0,
          };
        }) ?? [];
      const reminderFields: OutputField[] =
        parsed.reminderFields?.map((field) => {
          // Old field to get the label and guide
          let id = field.id ?? ++maxId;
          const oldField = userModel.reminderFields.get(id);
          // if oldField is not found id should be the new maxId
          if (!oldField) {
            id = ++maxId;
          }

          return {
            id,
            label: field?.label ?? '',
            value: field.value ?? '',
            guide: oldField?.guide ?? '',
            sample: oldField?.sample ?? '',
            order: oldField?.order ?? 0,
          };
        }) ?? [];
      const warningFields: OutputField[] =
        parsed.warningFields?.map((field) => {
          // Old field to get the label and guide
          let id = field.id ?? ++maxId;
          const oldField = userModel.warningFields.get(id);
          // if oldField is not found id should be the new maxId
          if (!oldField) {
            id = ++maxId;
          }

          return {
            id,
            label: field?.label ?? '',
            value: field.value ?? '',
            guide: oldField?.guide ?? '',
            sample: oldField?.sample ?? '',
            order: oldField?.order ?? 0,
          };
        }) ?? [];

      return {
        noteFields: noteFields,
        reminderFields: reminderFields,
        warningFields: warningFields,
        tokensUsed: aiResponse.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      // Log the error for debugging
      this.logger.error('Error analyzing user model');
      this.logger.error(error);
      return {
        noteFields: [],
        reminderFields: [],
        warningFields: [],
        tokensUsed: aiResponse.usageMetadata?.totalTokenCount,
      };
    }
  }

  private getMimeTypeFromUrl(url: string): string {
    // Try to get extension from URL
    const urlParts = url.split('?')[0]; // Remove query parameters
    const extension = urlParts.split('.').pop()?.toLowerCase();

    // If no extension found or extension is the same as the URL (no dot found)
    if (extension === undefined || extension === urlParts) {
      return 'audio/mp3';
    }

    switch (extension) {
      case 'mp3':
        return 'audio/mp3';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'webm':
        return 'audio/webm';
      case 'm4a':
        return 'audio/mp4';
      case 'aac':
        return 'audio/aac';
      case 'flac':
        return 'audio/flac';
      case 'opus':
        return 'audio/opus';
      case 'weba':
        return 'audio/webm';
      default:
        return 'audio/mp3';
    }
  }
}
