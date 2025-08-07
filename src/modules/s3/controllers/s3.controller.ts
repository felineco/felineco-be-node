// src/modules/s3/controllers/s3.controller.ts
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorators/auth.decorator';
import { RequestWithJwtPayload } from 'src/modules/auth/interfaces/jwt-request.interface';
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
    @Req() req: RequestWithJwtPayload,
    @Body() generatePresignedUrlDto: GeneratePresignedUrlDto,
  ): Promise<PresignedUrlResponseDto> {
    const {
      presignedUrl,
      url: key,
      expiresIn,
      expiresAt,
    } = await this.s3Service.generatePresignedUrl(
      generatePresignedUrlDto.type,
      generatePresignedUrlDto.filename,
      req.user.sub,
    );

    const response: PresignedUrlResponseDto = {
      presignedUrl,
      url: key,
      expiresIn,
      expiresAt,
    };

    return response;
  }
}
