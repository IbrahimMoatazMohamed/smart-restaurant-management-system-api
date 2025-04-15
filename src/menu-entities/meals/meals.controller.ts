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

/**
 * Meals Controller
 *
 * Handles meal-related operations
 */
@ApiTags('meals')
@Controller('meals')
export class MealsController {
  /**
   * Constructor
   *
   * Initializes the meals service and custom logger
   */
  constructor(
    private readonly mealsService: MealsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MealsController');
  }

  /**
   * Create a new meal
   *
   * @param createMealDto Meal creation data
   * @returns Created meal
   */
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
  async create(@Body() createMealDto: CreateMealDto): Promise<MealResponseDto> {
    this.logger.log(`Creating new meal with name: ${createMealDto.name}`);

    return await this.mealsService.create(createMealDto);
  }

  /**
   * Get all meals
   *
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
  async findAll(): Promise<MealResponseDto[]> {
    this.logger.log('Retrieving all meals');

    return await this.mealsService.findAll();
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
   * Delete a meal
   *
   * @param id Meal ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a meal' })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Meal has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Meal not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete meal.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting meal with ID: ${id}`);

    await this.mealsService.remove(+id);
  }
}
