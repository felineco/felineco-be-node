// src/common/interfaces/audio-message.interface.ts

// order is an integer indicating the sequence of the audio segment
// isLargeChunk indicates if the audio segment is a large chunk.
// Every n-1 small chunks segments are sent a big chunk segment including all
// previous small chunks are sent to ensure context is preserved.
// Large chunks have an order of k*n with k being an integer

export interface AudioMessage {
  id: string;
  order: number;
  isLargeChunk: boolean;
  userId: string;
}
