// src/modules/ai-services/ai-services.module.ts
import { Module } from '@nestjs/common';
import { GeminiService } from './services/gemini.service';
import { OpenAIService } from './services/openai.service';

@Module({
  providers: [OpenAIService, GeminiService],
  exports: [OpenAIService, GeminiService],
})
export class AiServicesModule {}
