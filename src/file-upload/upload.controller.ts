import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryUploadService } from './cloudinary-upload.service';

@ApiTags('File Upload')
@Controller(':tenantId/upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(
    private readonly cloudinaryUploadService: CloudinaryUploadService,
  ) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            public_id: { type: 'string' },
            secure_url: { type: 'string' },
            url: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
            format: { type: 'string' },
            resource_type: { type: 'string' },
            bytes: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or file too large',
  })
  async uploadImage(
    @Param('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryUploadService.uploadImage(
      file,
      tenantId,
    );

    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Post('image/:folder')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an image to a specific folder in Cloudinary',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({
    name: 'folder',
    description: 'Folder name (e.g., menu-items, users, restaurants)',
    example: 'menu-items',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully to specific folder',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            public_id: { type: 'string' },
            secure_url: { type: 'string' },
            url: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' },
            format: { type: 'string' },
            resource_type: { type: 'string' },
            bytes: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or file too large',
  })
  async uploadImageToFolder(
    @Param('tenantId') tenantId: string,
    @Param('folder') folder: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.cloudinaryUploadService.uploadImage(
      file,
      tenantId,
      folder,
    );

    return {
      message: `Image uploaded successfully to ${folder} folder`,
      data: result,
    };
  }

  @Delete('image/:publicId')
  @ApiOperation({ summary: 'Delete an image from Cloudinary' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({
    name: 'publicId',
    description: 'Cloudinary public ID of the image to delete',
    example: 'smart-restaurant/tenant1/menu-items/pizza_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Failed to delete image',
  })
  async deleteImage(
    @Param('tenantId') tenantId: string,
    @Param('publicId') publicId: string,
  ) {
    // Decode the publicId in case it's URL encoded
    const decodedPublicId = decodeURIComponent(publicId);

    const result =
      await this.cloudinaryUploadService.deleteImage(decodedPublicId);

    return {
      message: 'Image deleted successfully',
      data: result,
    };
  }
}
