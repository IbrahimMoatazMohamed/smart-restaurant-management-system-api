import { Injectable } from '@nestjs/common';
import { FileUploadService } from '../file-upload.service';

/**
 * Helper service for file upload operations
 */
@Injectable()
export class ImageUploadHelper {
  constructor(private readonly fileUploadService: FileUploadService) {}

  /**
   * Extract image URL from uploaded file
   *
   * @param photo Uploaded file
   * @returns Image URL or empty string
   */
  extractImageUrl(photo: Express.Multer.File | undefined): string {
    if (!photo) {
      return '';
    }

    const photoUrl = this.fileUploadService.getFileUrl(photo.filename);
    return photoUrl || '';
  }
}
