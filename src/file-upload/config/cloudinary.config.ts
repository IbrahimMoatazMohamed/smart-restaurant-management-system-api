import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryConfig {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloudinary_url: this.configService.get<string>('CLOUDINARY_URL'),
    });
  }

  getCloudinary() {
    return cloudinary;
  }
}
