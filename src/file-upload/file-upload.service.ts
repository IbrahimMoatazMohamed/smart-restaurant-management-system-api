import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('API_BASE_URL') || 'http://localhost:3030';
    const uploadPath = join(process.cwd(), 'uploads');
    if (!existsSync(uploadPath)) {
      this.logger.log(`Creating uploads directory at ${uploadPath}`);
      mkdirSync(uploadPath, { recursive: true });
    }
  }

  /**
   * Get the URL for a file
   * @param filename The filename
   * @returns The URL for the file or null if filename is not provided
   */
  getFileUrl(filename: string): string | null {
    if (!filename) return null;
    if (filename.startsWith('http')) {
      return filename;
    }
    return `${this.baseUrl}/uploads/${filename}`;
  }

  /**
   * Process a file upload
   * @param file The uploaded file
   * @returns The URL for the uploaded file or null if file is not provided
   */
  processUploadedFile(file: Express.Multer.File): string | null {
    if (!file) return null;
    return this.getFileUrl(file.filename);
  }
}
