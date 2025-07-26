// src/modules/ai-assistants/dtos/requests/send-message.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AiAssistantBaseRequestDto } from './base-request.dto';

export class SendMessageDto extends AiAssistantBaseRequestDto {
  @ApiProperty({
    example: 'Hello, how can I help you?',
    description: 'Message to send',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
