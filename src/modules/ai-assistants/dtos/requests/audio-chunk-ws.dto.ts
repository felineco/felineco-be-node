// src/modules/ai-assistants/dtos/requests/audio-chunk-ws.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AudioChunkWsDto {
  @ApiProperty({
    example: 'b3d8a2e2-4c1f-4e9a-9c2e-8f1a2b3c4d5e',
    description: 'ID of the recording of the audio chunk',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 7,
    description:
      'Order/sequence number of the audio chunk. Order must start from 1',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  order: number;

  @ApiProperty({
    example: false,
    description: 'Indicates if the audio chunk is a large chunk',
  })
  @IsNotEmpty()
  isLargeChunk: boolean;

  @ApiProperty({
    example: 'base64encodedaudiodata...',
    description: 'Base64 encoded audio chunk data',
  })
  @IsString()
  @IsNotEmpty()
  chunk: string;
}
