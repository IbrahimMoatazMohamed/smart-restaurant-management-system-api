import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadService } from '../../file-upload/file-upload.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemStatus } from './entities/item.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { ItemResponseDto } from './dto/item-response.dto';

/**
 * Items Controller
 *
 * Handles item-related operations including creation, retrieval, update, and deletion of menu items
 */
@ApiTags('items')
@Controller('items')
export class ItemsController {
  /**
   * Constructor
   *
   * Initializes the items service and custom logger
   */
  constructor(
    private readonly itemsService: ItemsService,
    private readonly logger: CustomLoggerService,
    private readonly fileUploadService: FileUploadService,
  ) {
    this.logger.setContext('ItemsController');
  }

  /**
   * Create a new item
   *
   * @param createItemDto Item creation data
   * @returns Created item
   */
  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The item has been successfully created.',
    type: ItemResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiConflictResponse({
    description: 'Item with the same name already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create item.',
  })
  async create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<ItemResponseDto> {
    this.logger.log(`Creating new item: ${createItemDto.name}`);

    if (photo) {
      const photoUrl = this.fileUploadService.getFileUrl(photo.filename);
      createItemDto.photo = photoUrl || undefined;
    }

    return await this.itemsService.create(createItemDto);
  }

  /**
   * Get all items
   *
   * @param status Optional status filter
   * @returns List of all items, optionally filtered by status
   */
  @Get()
  @ApiOperation({ summary: 'Get all items' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter items by status',
    enum: ItemStatus,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all items.',
    type: [ItemResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid status parameter.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve items.',
  })
  async findAll(@Query('status') status?: ItemStatus) {
    this.logger.log(
      `Getting all items${status ? ` with status: ${status}` : ''}`,
    );

    if (status) {
      return await this.itemsService.findByStatus(status);
    }
    return await this.itemsService.findAll();
  }

  /**
   * Get a specific item by ID
   *
   * @param id Item ID
   * @returns The found item
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific item by ID' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the item with the specified ID.',
    type: ItemResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Item not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve item.',
  })
  async findOne(@Param('id') id: string): Promise<ItemResponseDto> {
    this.logger.log(`Getting item with ID: ${id}`);

    return await this.itemsService.findOne(+id);
  }

  /**
   * Update an item
   *
   * @param id Item ID
   * @param updateItemDto Item update data
   * @returns The updated item
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The item has been successfully updated.',
    type: ItemResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Item not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiConflictResponse({
    description: 'Item with the same name already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update item.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<ItemResponseDto> {
    this.logger.log(`Updating item with ID: ${id}`);

    if (photo) {
      const photoUrl = this.fileUploadService.getFileUrl(photo.filename);
      updateItemDto.photo = photoUrl || undefined;
    }

    return await this.itemsService.update(+id, updateItemDto);
  }

  /**
   * Remove an item
   *
   * @param id Item ID
   * @returns Void
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remove an item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The item has been successfully removed.',
  })
  @ApiNotFoundResponse({
    description: 'Item not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to remove item.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Removing item with ID: ${id}`);

    await this.itemsService.remove(+id);
  }
}
