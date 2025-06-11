import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
  ParseBoolPipe,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { MealResponseDto } from './dto/meal-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadService } from 'src/file-upload/file-upload.service';

/**
 * Meals Controller
 *
 * Handles meal-related operations
 */
@ApiTags('meals')
@Controller('meals')
@UseInterceptors(ClassSerializerInterceptor)
export class MealsController {
  /**
   * Constructor
   *
   * Initializes the meals service and custom logger
   */
  constructor(
    private readonly mealsService: MealsService,
    private readonly logger: CustomLoggerService,
    private readonly fileUploadService: FileUploadService,
  ) {
    this.logger.setContext('MealsController');
  }

  /**
   * Create a new meal
   *
   * @param createMealDto Meal creation data
   * @returns Created meal
   */
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
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new meal' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Meal has been successfully created.',
    type: MealResponseDto,
  })
  @ApiConflictResponse({
    description: 'Meal name already exists.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or one or more items do not exist.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create meal.',
  })
  async create(
    @Body() createMealDto: CreateMealDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<MealResponseDto> {
    this.logger.log(`Creating new meal with name: ${createMealDto.name}`);

    if (photo) {
      const photoUrl = this.fileUploadService.getFileUrl(photo.filename);
      createMealDto.photo = photoUrl || '';
    } else {
      throw new BadRequestException('Photo is required');
    }

    return await this.mealsService.create(createMealDto);
  }

  /**
   * Find all soft-deleted meals
   */
  @Get('soft-deleted')
  @ApiOperation({ summary: 'Find all soft-deleted meals' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of soft-deleted meals.',
    type: [MealResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve soft-deleted meals.',
  })
  async findAllSoftDeleted(): Promise<MealResponseDto[]> {
    this.logger.log('Finding all soft-deleted meals');

    return await this.mealsService.findAllSoftDeleted();
  }

  /**
   * Get all meals
   *
   * @param includeDeleted Whether to include soft-deleted meals
   * @returns List of all meals
   */
  @Get()
  @ApiOperation({ summary: 'Get all meals' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all meals.',
    type: [MealResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve meals.',
  })
  async findAll(
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ): Promise<MealResponseDto[]> {
    this.logger.log(
      `Retrieving all meals${includeDeleted ? ' including deleted' : ''}`,
    );

    return await this.mealsService.findAll(includeDeleted);
  }

  /**
   * Get a meal by ID
   *
   * @param id Meal ID
   * @returns Meal
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a meal by ID' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal found.',
    type: MealResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Meal not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve meal.',
  })
  async findOne(@Param('id') id: string): Promise<MealResponseDto> {
    this.logger.log(`Retrieving meal with ID: ${id}`);

    return await this.mealsService.findOne(+id);
  }

  /**
   * Update a meal
   *
   * @param id Meal ID
   * @param updateMealDto Meal update data
   * @returns Updated meal
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a meal' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal has been successfully updated.',
    type: MealResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Meal not found.',
  })
  @ApiConflictResponse({
    description: 'Meal name already exists.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or one or more items do not exist.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update meal.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMealDto: UpdateMealDto,
  ): Promise<MealResponseDto> {
    this.logger.log(`Updating meal with ID: ${id}`);

    return await this.mealsService.update(+id, updateMealDto);
  }

  /**
   * Soft delete a meal
   *
   * @param id Meal ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a meal' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Meal has been successfully soft-deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Meal not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete meal.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Soft deleting meal with ID: ${id}`);

    await this.mealsService.remove(id);
  }

  /**
   * Restore a soft-deleted meal
   *
   * @param id Meal ID
   * @returns Restored meal
   */
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted meal' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meal has been successfully restored.',
    type: MealResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Meal not found.',
  })
  @ApiBadRequestResponse({
    description: 'Meal is not deleted.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to restore meal.',
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MealResponseDto> {
    this.logger.log(`Restoring meal with ID: ${id}`);

    return await this.mealsService.restore(id);
  }

  s; /**
   * Find meals by active status
   *
   * @param isActive Active status to filter by
   */
  @Get('by-status/:isActive')
  @ApiOperation({ summary: 'Find meals by active status' })
  @ApiParam({ name: 'isActive', description: 'Active status (true/false)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of meals with specified status.',
    type: [MealResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve meals by status.',
  })
  async findByActiveStatus(
    @Param('isActive', new ParseBoolPipe()) isActive: boolean,
  ): Promise<MealResponseDto[]> {
    this.logger.log(`Finding meals with isActive=${isActive}`);

    return await this.mealsService.findByActiveStatus(isActive);
  }

  /**
   * Soft delete a meal using a dedicated endpoint
   *
   * @param id Meal ID
   */
  @Delete(':id/soft-delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a meal (dedicated endpoint)' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Meal has been successfully soft-deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Meal not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to soft delete meal.',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Soft deleting meal with ID: ${id}`);

    await this.mealsService.remove(id);
  }
}
