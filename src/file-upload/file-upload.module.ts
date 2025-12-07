import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { ImageUploadHelper } from './helpers/image-upload.helper';
import { CloudinaryConfig } from './config/cloudinary.config';
import { CloudinaryUploadService } from './cloudinary-upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      // Configure multer to store files in memory for Cloudinary upload
      storage: 'memory',
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size (Cloudinary limit)
      },
    }),
  ],
  controllers: [UploadController],
  providers: [
    FileUploadService,
    ImageUploadHelper,
    CloudinaryConfig,
    CloudinaryUploadService,
  ],
  exports: [
    FileUploadService,
    ImageUploadHelper,
    CloudinaryConfig,
    CloudinaryUploadService,
  ],
})
export class FileUploadModule {}
