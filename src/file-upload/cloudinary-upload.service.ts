import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CloudinaryConfig } from './config/cloudinary.config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

@Injectable()
export class CloudinaryUploadService {
  private readonly logger = new Logger(CloudinaryUploadService.name);

  constructor(private readonly cloudinaryConfig: CloudinaryConfig) {}

  /**
   * Upload image to Cloudinary with tenant-specific folder structure
   * @param file The file to upload
   * @param tenantId The tenant ID for folder organization
   * @param folder Optional subfolder (e.g., 'menu-items', 'users', 'restaurants')
   * @returns Promise with upload result
   */
  async uploadImage(
    file: Express.Multer.File,
    tenantId: string,
    folder?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      this.validateImageFile(file);

      const cloudinary = this.cloudinaryConfig.getCloudinary();

      // Create folder structure: smart-restaurant/{tenantId}/{folder}
      const folderPath = folder
        ? `smart-restaurant/${tenantId}/${folder}`
        : `smart-restaurant/${tenantId}`;

      const uploadOptions = {
        folder: folderPath,
        resource_type: 'image' as const,
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
        // Use original filename (without extension) as public_id base
        public_id: this.generatePublicId(file.originalname),
      };

      this.logger.log(`Uploading image to Cloudinary folder: ${folderPath}`);

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            uploadOptions,
            (
              error: UploadApiErrorResponse | undefined,
              result: UploadApiResponse | undefined,
            ) => {
              if (error) {
                this.logger.error('Cloudinary upload error:', error);
                reject(error);
              } else if (result) {
                resolve(result);
              } else {
                reject(new Error('Upload failed - no result returned'));
              }
            },
          )
          .end(file.buffer);
      });

      this.logger.log(`Image uploaded successfully: ${result.secure_url}`);

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error('Failed to upload image to Cloudinary:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId The public ID of the image to delete
   * @returns Promise with deletion result
   */
  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      const cloudinary = this.cloudinaryConfig.getCloudinary();
      const result = await cloudinary.uploader.destroy(publicId);

      this.logger.log(`Image deleted from Cloudinary: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to delete image from Cloudinary:', error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param publicId The public ID of the image
   * @param width Optional width for resizing
   * @param height Optional height for resizing
   * @param quality Optional quality setting
   * @returns Optimized image URL
   */
  getOptimizedImageUrl(
    publicId: string,
    width?: number,
    height?: number,
    quality: string = 'auto:good',
  ): string {
    const cloudinary = this.cloudinaryConfig.getCloudinary();

    const transformations: any = {
      quality,
      fetch_format: 'auto',
    };

    if (width) transformations.width = width;
    if (height) transformations.height = height;
    if (width && height) transformations.crop = 'fill';

    return cloudinary.url(publicId, {
      transformation: transformations,
    });
  }

  /**
   * Validate image file
   * @param file The file to validate
   */
  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file size (10MB max as per Cloudinary plan)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }
  }

  /**
   * Generate a clean public ID from filename
   * @param originalname The original filename
   * @returns Clean public ID
   */
  private generatePublicId(originalname: string): string {
    const nameWithoutExt = originalname.replace(/\.[^/.]+$/, '');
    const cleanName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const timestamp = Date.now();
    return `${cleanName}_${timestamp}`;
  }
}
