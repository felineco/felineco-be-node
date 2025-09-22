// src/modules/audio/services/audio-processing.service.ts
import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { AppLoggerService } from 'src/common/services/logger.service';

@Injectable()
export class AudioProcessingService {
  private readonly tempDir: string;

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(AudioProcessingService.name);
    this.tempDir = path.join(process.cwd(), 'temp');
  }

  async combineBase64AudioChunks(
    base64AudioData: {
      id: string;
      base64Audios: string;
    }[],
    trimStartSeconds: number,
  ): Promise<string> {
    if (base64AudioData.length === 0) {
      return '';
    }
    if (base64AudioData.length === 1) {
      return base64AudioData[0].base64Audios;
    }

    const tempFiles: string[] = [];
    const idsCombined = base64AudioData.map((data) => data.id).join('_');
    const outputFile = path.join(
      this.tempDir,
      `combined_${idsCombined}_${Date.now()}.mp3`,
    );

    try {
      // Ensure temp directory exists
      this.ensureTempDir();

      // Create temporary files
      for (let i = 0; i < base64AudioData.length; i++) {
        const tempFile = path.join(
          this.tempDir,
          `${base64AudioData[i].id}.mp3`,
        );
        const buffer = Buffer.from(base64AudioData[i].base64Audios, 'base64');
        fs.writeFileSync(tempFile, buffer);
        tempFiles.push(tempFile);
      }

      return new Promise<string>((resolve, reject) => {
        const command = ffmpeg();

        command.input(tempFiles[0]);

        for (let i = 1; i < base64AudioData.length; i++) {
          command.input(tempFiles[i]).inputOptions(`-ss ${trimStartSeconds}`);
        }

        command
          .on('end', () => {
            try {
              const combinedBuffer = fs.readFileSync(outputFile);
              const combinedBase64 = combinedBuffer.toString('base64');

              // Clean up ALL files after successful processing
              this.cleanupFiles([...tempFiles, outputFile]);

              resolve(combinedBase64);
            } catch (error) {
              this.cleanupFiles([...tempFiles, outputFile]);
              reject(error as Error);
            }
          })
          .on('error', (error) => {
            this.logger.error(`FFmpeg error: ${error.message}`);

            // Clean up files on error
            this.cleanupFiles([...tempFiles, outputFile]);

            reject(error);
          })
          .mergeToFile(outputFile, this.tempDir);
      });
    } catch (error) {
      this.logger.error(`Error combining audio files: ${error}`);

      // Clean up files if there's an error during setup
      this.cleanupFiles(tempFiles);

      throw error;
    }
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
  }

  private cleanupFiles(files: string[]): void {
    for (const file of files) {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        this.logger.warn(`Failed to delete temp file ${file}: ${err}`);
      }
    }
  }
}
