import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * Decorator for handling profile image uploads
 * Configures the FileInterceptor with standard settings for profile images
 *
 * @param destination The destination folder within uploads directory
 * @returns Decorator function
 */
export function ImageUpload(destination: string = '') {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor('photo', {
        storage: diskStorage({
          destination: './uploads' + (destination ? '/' + destination : ''),
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      }),
    ),
  );
}
