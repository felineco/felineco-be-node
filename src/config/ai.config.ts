// src/config/ai.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  googleApiKey: process.env.GOOGLE_API_KEY ?? '',
  transcriptionConfig: {
    audioOverlapLength: Number(process.env.AUDIO_OVERLAP_LENGTH ?? 5), // 5 seconds as default
    audioSegmentToOverlapLengthRatio: Number(
      process.env.AUDIO_SEGMENT_TO_OVERLAP_LENGTH_RATIO ?? 1,
    ), // 1:1 ratio as default
    audioBigChunkCycle: Number(process.env.AUDIO_BIG_CHUNK_CYCLE ?? 10), // Every 10 segment is a big chunk
  },
}));
