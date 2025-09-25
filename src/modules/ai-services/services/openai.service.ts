// src/modules/ai-services/services/openai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { LanguageEnum } from 'src/common/enums/language.enum';
import { z } from 'zod';
import { OpenAIModel } from '../enums/openai-model.enum';

const ImageAnalysisAIResult = z.object({
  description: z.string(),
});

const ExtractOutputFieldsAIResult = z.object({
  outputFields: z.array(
    z.object({
      label: z.string(),
      guide: z.string(),
    }),
  ),
});

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private analyzeImagePrompt = `Extract all medical and patient information from this document. Including but not limited to: patient demographics, facility info, exam details, measurements, findings, diagnosis, physician, dates, etc... Keep original language where applicable. The output description will be pasted as a whole to another AI for further processing into an electronic health record.`;
  private extractOutputFieldsPrompt = `Extract all input fields from the images (mostly screenshots of an EHR system). For each field, provide: Label (the field name as shown) and Guide (instructions for what data to enter for other AI to use).`;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.openaiApiKey') ?? '';
    if (apiKey === '') {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
      maxRetries: 3,
    });
  }

  async analyzeImages(
    imageUrl: string,
  ): Promise<{ description: string; tokensUsed?: number }> {
    const response = await this.openai.responses.parse({
      model: OpenAIModel.GPT_5,
      // max_output_tokens: 1000,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: this.analyzeImagePrompt },
            { type: 'input_image', image_url: imageUrl, detail: 'auto' },
          ],
        },
      ],
      text: {
        format: zodTextFormat(
          ImageAnalysisAIResult,
          'image_analysis_ai_result',
        ),
      },
    });

    const result = {
      description: response.output_parsed?.description ?? '',
      tokensUsed: response.usage?.total_tokens,
    };

    return result;
  }

  async extractOutputFields(
    imageUrls: string[],
    language: LanguageEnum = LanguageEnum.EN_US,
  ): Promise<{
    outputFields: Array<{ label: string; guide: string }>;
    tokensUsed?: number;
  }> {
    // Build the content for all image URLs
    const imageUrlsContent: {
      type: 'input_image';
      image_url: string;
      detail: 'auto';
    }[] = imageUrls.map((url) => ({
      type: 'input_image',
      image_url: url,
      detail: 'auto',
    }));
    const response = await this.openai.responses.parse({
      model: OpenAIModel.GPT_5_NANO,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: this.extractOutputFieldsPrompt },
            {
              type: 'input_text',
              text: `The language of the conversation is likely (but note 100%) to be ${language}.`,
            },
            ...imageUrlsContent,
          ],
        },
      ],
      text: {
        format: zodTextFormat(
          ExtractOutputFieldsAIResult,
          'extract_output_fields_ai_result',
        ),
      },
      reasoning: { effort: 'low' },
    });

    const result = {
      outputFields: response.output_parsed?.outputFields ?? [],
      tokensUsed: response.usage?.total_tokens,
    };

    return result;
  }
}
