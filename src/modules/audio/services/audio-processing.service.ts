// src/modules/audio/services/audio-processing.service.ts
import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { AppLoggerService } from 'src/common/services/logger.service';
import { PassThrough, Readable } from 'stream';

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
      order: number;
      base64Audio: string;
    }[],
    trimStartSeconds: number,
    redundantInitialSecondsFrontEndNeedForMetaData: number, // Trim this length from the start of subsequent chunks due to frontend technical limitation
    isFirstChunkFromFrontEndIncluded: boolean,
  ): Promise<string> {
    if (base64AudioData.length === 0) {
      return '';
    }
    if (base64AudioData.length === 1) {
      return base64AudioData[0].base64Audio;
    }

    const tempFiles: string[] = [];
    const outputFile = path.join(
      this.tempDir,
      `combined_${base64AudioData[0].id}_${Date.now()}.webm`,
    );

    try {
      // Ensure temp directory exists
      this.ensureTempDir();

      // Create temporary files
      for (let i = 0; i < base64AudioData.length; i++) {
        const tempFile = path.join(
          this.tempDir,
          `${base64AudioData[i].id}_${base64AudioData[i].order}_${i}.webm`,
        );
        const buffer = Buffer.from(base64AudioData[i].base64Audio, 'base64');
        fs.writeFileSync(tempFile, buffer);
        tempFiles.push(tempFile);
      }

      return new Promise<string>((resolve, reject) => {
        const command = ffmpeg();

        command
          .input(tempFiles[0])
          .inputOptions(
            `-ss ${isFirstChunkFromFrontEndIncluded ? 0 : redundantInitialSecondsFrontEndNeedForMetaData}`,
          );

        for (let i = 1; i < base64AudioData.length; i++) {
          command
            .input(tempFiles[i])
            .inputOptions(
              `-ss ${trimStartSeconds + redundantInitialSecondsFrontEndNeedForMetaData}`,
            );
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
            this.logger.error(error);

            // Clean up files on error
            this.cleanupFiles([...tempFiles, outputFile]);

            reject(error);
          })
          .mergeToFile(outputFile, this.tempDir);
      });
    } catch (error) {
      this.logger.error(error);

      // Clean up files if there's an error during setup
      this.cleanupFiles(tempFiles);

      throw error;
    }
  }

  // This method is for debugging purposes
  // only when sending chunks from frontend
  async trimFirstSeconds(
    base64Audio: string,
    seconds: number,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Audio, 'base64');

        // Create readable stream from buffer
        const inputStream = new Readable();
        inputStream.push(buffer);
        inputStream.push(null);

        // Create output stream to collect data
        const outputStream = new PassThrough();
        const chunks: Buffer[] = [];

        outputStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        outputStream.on('end', () => {
          const resultBuffer = Buffer.concat(chunks);
          const resultBase64 = resultBuffer.toString('base64');
          resolve(resultBase64);
        });

        // Process with ffmpeg using streams
        ffmpeg(inputStream)
          .setStartTime(seconds) // Skip first X seconds
          .format('webm')
          .on('error', (error) => {
            this.logger.error(`FFmpeg trim error: ${error.message}`);
            reject(error);
          })
          .pipe(outputStream);
      } catch (error) {
        this.logger.error(`Error trimming audio: ${error}`);
        reject(error as Error);
      }
    });
  }

  // This method is for debugging purposes
  // only when sending chunks from frontend
  async saveWebmAudioFile(base64Audio: string): Promise<void> {
    const tempFile = path.join(this.tempDir, `${Date.now()}.webm`);
    const buffer = Buffer.from(base64Audio, 'base64');
    fs.writeFileSync(tempFile, buffer);
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
