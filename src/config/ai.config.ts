// src/config/ai.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  googleApiKey: process.env.GOOGLE_API_KEY ?? '',
  transcriptionConfig: {
    audioSegmentLength: Number(process.env.AUDIO_SEGMENT_LENGTH ?? 5), // 5 seconds as default
    audioOverlapLength: Number(process.env.AUDIO_OVERLAP_LENGTH ?? 5), // 5 seconds as default
  },
}));
