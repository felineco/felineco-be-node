// src/modules/ai-assistants/dtos/requests/base-request.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AiAssistantBaseRequestDto {
  @ApiProperty({
    example: 'sample-socket-id',
    description: 'Socket ID of the connection sent by server',
  })
  @IsString()
  @IsNotEmpty()
  socketId: string;
}
