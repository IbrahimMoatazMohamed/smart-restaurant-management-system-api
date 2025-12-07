import { Injectable } from '@nestjs/common';
import { CloudinaryUploadService } from '../cloudinary-upload.service';

/**
 * Helper service for file upload operations with Cloudinary
 */
@Injectable()
export class ImageUploadHelper {
  constructor(
    private readonly cloudinaryUploadService: CloudinaryUploadService,
  ) {}

  /**
   * Upload image to Cloudinary and return URL
   *
   * @param photo Uploaded file
   * @param tenantId Tenant ID for folder organization
   * @param folder Optional subfolder (e.g., 'users', 'meals', 'menu-items')
   * @returns Promise with image URL or empty string
   */
  async uploadImageAndGetUrl(
    photo: Express.Multer.File | undefined,
    tenantId: string,
    folder?: string,
  ): Promise<string> {
    if (!photo) {
      return '';
    }

    try {
      const result = await this.cloudinaryUploadService.uploadImage(
        photo,
        tenantId,
        folder,
      );
      return result.secure_url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return '';
    }
  }

  /**
   * @deprecated Use uploadImageAndGetUrl instead
   * This method is kept for backward compatibility but will return empty string
   * since we no longer use local file storage
   */
  extractImageUrl(): string {
    console.warn(
      'extractImageUrl is deprecated. Use uploadImageAndGetUrl instead.',
    );
    return '';
  }
}
