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
  UseGuards,
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
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MealsService } from './meals.service';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { MealResponseDto } from './dto/meal-response.dto';
import { ImageUpload } from 'src/file-upload/decorators/image-upload.decorator';
import { ImageUploadHelper } from 'src/file-upload/helpers/image-upload.helper';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AdminOnly } from 'src/auth/decorators/roles.decorator';

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
    private readonly imageUploadHelper: ImageUploadHelper,
  ) {
    this.logger.setContext('MealsController');
  }

  /**
   * Create a new meal
   *
   * @param createMealDto Meal creation data
   * @returns Created meal
   */
  @ImageUpload()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post()
  @ApiBearerAuth('JWT-auth')
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image upload',
    type: CreateMealDto,
  })
  async create(
    @Body() createMealDto: CreateMealDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<MealResponseDto> {
    this.logger.log(`Creating new meal with name: ${createMealDto.name}`);

    createMealDto.photo = this.imageUploadHelper.extractImageUrl(photo);

    return await this.mealsService.create(createMealDto);
  }

  /**
   * Find all soft-deleted meals
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('soft-deleted')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ImageUpload()
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update meal with optional image upload',
    type: UpdateMealDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateMealDto: UpdateMealDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<MealResponseDto> {
    this.logger.log(`Updating meal with ID: ${id}`);
    delete updateMealDto.photo;

    updateMealDto.photo = this.imageUploadHelper.extractImageUrl(photo);

    return await this.mealsService.update(+id, updateMealDto);
  }

  /**
   * Soft delete a meal
   *
   * @param id Meal ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post(':id/restore')
  @ApiBearerAuth('JWT-auth')
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

  /**
   * Find meals by active status
   *
   * @param isActive Active status to filter by
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('by-status/:isActive')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':id/soft-delete')
  @ApiBearerAuth('JWT-auth')
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
