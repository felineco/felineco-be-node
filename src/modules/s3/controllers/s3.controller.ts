// src/modules/s3/controllers/s3.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { GeneratePresignedUrlDto } from '../dtos/requests/generate-presigned-url.dto';
import { PresignedUrlResponseDto } from '../dtos/responses/presigned-url-response.dto';
import { S3Service } from '../services/s3.service';

@ApiTags('S3')
@Controller('blob')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Auth()
  @Post('presigned-url')
  async generatePresignedUrl(
    @Body() generatePresignedUrlDto: GeneratePresignedUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    const { presignedUrl, key, expiresIn, expiresAt } =
      await this.s3Service.generatePresignedUrl(
        generatePresignedUrlDto.type,
        generatePresignedUrlDto.filename,
      );

    const response: PresignedUrlResponseDto = {
      presignedUrl,
      key,
      expiresIn,
      expiresAt,
    };

    return response;
  }
}
