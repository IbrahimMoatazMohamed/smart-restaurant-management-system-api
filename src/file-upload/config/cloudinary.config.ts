import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryConfig {
  private readonly logger = new Logger(CloudinaryConfig.name);

  constructor(private configService: ConfigService) {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');

    if (!cloudinaryUrl) {
      this.logger.error('CLOUDINARY_URL environment variable is not set!');
      this.logger.error('Please add CLOUDINARY_URL to your .env file');
      this.logger.error(
        'Format: CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name',
      );
      throw new Error('CLOUDINARY_URL environment variable is required');
    }

    this.logger.log('Configuring Cloudinary...');

    // Try URL-based configuration first
    cloudinary.config({
      cloudinary_url: cloudinaryUrl,
    });

    // Verify configuration
    let config = cloudinary.config();

    // If URL parsing failed, try manual parsing as fallback
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      this.logger.warn('URL parsing failed, attempting manual parsing...');

      // Manual parsing of cloudinary://api_key:api_secret@cloud_name
      const urlMatch = cloudinaryUrl.match(
        /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/,
      );

      if (urlMatch) {
        const [, api_key, api_secret, cloud_name] = urlMatch;
        this.logger.log(
          `Manual parsing successful - cloud_name: ${cloud_name}`,
        );

        cloudinary.config({
          cloud_name,
          api_key,
          api_secret,
        });

        config = cloudinary.config();
      }
    }

    // Final verification
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      this.logger.error(
        'Invalid CLOUDINARY_URL format. Expected: cloudinary://api_key:api_secret@cloud_name',
      );
      this.logger.error(`Current URL: ${cloudinaryUrl}`);
      this.logger.error(
        `Parsed values - api_key: ${config.api_key ? 'present' : 'missing'}, api_secret: ${config.api_secret ? 'present' : 'missing'}, cloud_name: ${config.cloud_name || 'missing'}`,
      );
      throw new Error('Invalid CLOUDINARY_URL format');
    }

    this.logger.log(
      `Cloudinary configured successfully for cloud: ${config.cloud_name}`,
    );
  }

  getCloudinary() {
    return cloudinary;
  }
}
