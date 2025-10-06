// src/modules/settings/dtos/responses/settings-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BackendConfigDto {
  @ApiProperty({
    example: 5,
    description: 'Audio overlap length in seconds',
  })
  overlapLength: number;

  @ApiProperty({
    example: 1,
    description: 'Audio segment to overlap length ratio',
  })
  audioSegmentToOverlapLengthRatio: number;

  @ApiProperty({
    example: 10,
    description: 'Cycle for big chunk processing',
  })
  bigChunkCycle: number;
}

export class BackendConfigResponseDto {
  @ApiProperty({ type: BackendConfigDto })
  audio: BackendConfigDto;
}
