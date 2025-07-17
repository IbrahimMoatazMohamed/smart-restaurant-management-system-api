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
  HttpCode,
  ParseIntPipe,
  ParseBoolPipe,
  BadRequestException,
  UseGuards,
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
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemStatus } from './entities/item.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { ItemResponseDto } from './dto/item-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminOnly } from '../../auth/decorators/roles.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image upload',
    type: CreateItemDto,
  })
  async create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<ItemResponseDto> {
    this.logger.log(`Creating new item: ${createItemDto.name}`);

    if (photo) {
      const photoUrl = this.fileUploadService.getFileUrl(photo.filename);
      createItemDto.photo = photoUrl || '';
    } else {
      throw new BadRequestException('Photo is required');
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
  async findAll(
    @Query('status') status?: ItemStatus,
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    this.logger.log(
      `Getting all items${status ? ` with status: ${status}` : ''}${includeDeleted ? ' including deleted' : ''}`,
    );

    if (status) {
      return await this.itemsService.findByStatus(status);
    }
    return await this.itemsService.findAll(includeDeleted);
  }

  /**
   * Find all soft-deleted items
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('soft-deleted')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Find all soft-deleted items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of soft-deleted items.',
    type: [ItemResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve soft-deleted items.',
  })
  async findAllSoftDeleted(): Promise<ItemResponseDto[]> {
    this.logger.log('Finding all soft-deleted items');

    return await this.itemsService.findAllSoftDeleted();
  }

  /**
   * Find items by deleted status
   *
   * @param deleted Whether to find deleted items
   * @returns List of active or deleted items
   */
  @Get('deleted/:deleted')
  @ApiOperation({ summary: 'Get items by deleted status' })
  @ApiParam({
    name: 'deleted',
    description: 'Deleted status to filter by (true/false)',
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns items with the specified deleted status.',
    type: [ItemResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve items.',
  })
  async findByDeletedStatus(
    @Param('deleted', new ParseBoolPipe()) deleted: boolean,
  ): Promise<ItemResponseDto[]> {
    this.logger.log(`Getting items with deleted=${deleted}`);

    return await this.itemsService.findByDeletedStatus(deleted);
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
    description: 'Returns the found item.',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image upload',
    type: UpdateItemDto,
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
   * Restore a soft-deleted item
   *
   * @param id Item ID
   * @returns Restored item
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore a soft-deleted item' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item has been successfully restored.',
    type: ItemResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Item not found.',
  })
  @ApiBadRequestResponse({
    description: 'Item is not deleted.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to restore item.',
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemResponseDto> {
    this.logger.log(`Restoring item with ID: ${id}`);

    return await this.itemsService.restore(id);
  }

  /**
   * Soft delete an item using a dedicated endpoint
   *
   * @param id Item ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':id/soft-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete an item (dedicated endpoint)' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Item has been successfully soft-deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Item not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to soft delete item.',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Soft deleting item with ID: ${id}`);

    await this.itemsService.remove(id);
  }
}
