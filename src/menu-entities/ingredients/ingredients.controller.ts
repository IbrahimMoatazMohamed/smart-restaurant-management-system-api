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
  getSchemaPath,
} from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { Ingredient } from './entities/ingredient.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';

/**
 * Ingredients Controller
 *
 * Handles ingredient-related operations
 */
@ApiTags('ingredients')
@Controller('ingredients')
export class IngredientsController {
  /**
   * Constructor
   *
   * Initializes the ingredients service and custom logger
   */
  constructor(
    private readonly ingredientsService: IngredientsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('IngredientsController');
  }

  /**
   * Create a new ingredient
   *
   * @param createIngredientDto Ingredient creation data
   * @returns Created ingredient
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ingredient' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ingredient has been successfully created.',
    type: IngredientResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ingredient with this name already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create ingredient.',
  })
  async create(
    @Body() createIngredientDto: CreateIngredientDto,
  ): Promise<Ingredient> {
    this.logger.log(
      `Creating new ingredient with name: ${createIngredientDto.name}`,
    );
    return await this.ingredientsService.create(createIngredientDto);
  }

  /**
   * Get all ingredients
   *
   * @returns List of all ingredients
   */
  @Get()
  @ApiOperation({ summary: 'Get all ingredients' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all ingredients.',
    type: [IngredientResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve ingredients.',
  })
  async findAll(): Promise<Ingredient[]> {
    this.logger.log('Retrieving all ingredients');

    return await this.ingredientsService.findAll();
  }

  /**
   * Get an ingredient by ID
   *
   * @param id Ingredient ID
   * @returns Ingredient
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get an ingredient by ID' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient found.',
    type: IngredientResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve ingredient.',
  })
  async findOne(@Param('id') id: string): Promise<Ingredient> {
    this.logger.log(`Retrieving ingredient with ID: ${id}`);

    return await this.ingredientsService.findOne(+id);
  }

  /**
   * Update an ingredient
   *
   * @param id Ingredient ID
   * @param updateIngredientDto Ingredient update data
   * @returns Updated ingredient
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an ingredient' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient has been successfully updated.',
    type: IngredientResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found.',
  })
  @ApiConflictResponse({
    description: 'Ingredient with this name already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update ingredient.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    this.logger.log(`Updating ingredient with ID: ${id}`);

    return await this.ingredientsService.update(+id, updateIngredientDto);
  }

  /**
   * Delete an ingredient
   *
   * @param id Ingredient ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an ingredient' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Ingredient has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete ingredient.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting ingredient with ID: ${id}`);

    await this.ingredientsService.remove(+id);
  }

  /**
   * Increase ingredient quantity
   *
   * @param id Ingredient ID
   * @param updateQuantityDto Quantity update data
   * @returns Updated ingredient
   */
  @Patch(':id/increase')
  @ApiOperation({ summary: 'Increase ingredient quantity' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient quantity has been successfully increased.',
    type: IngredientResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found.',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid amount, incompatible measurement units, or other validation error.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to increase ingredient quantity.',
  })
  async increaseQuantity(
    @Param('id') id: string,
    @Body() updateQuantityDto: UpdateQuantityDto,
  ): Promise<IngredientResponseDto> {
    this.logger.log(
      `Increasing quantity of ingredient ID: ${id} by ${updateQuantityDto.amount}${
        updateQuantityDto.measurement ? ` ${updateQuantityDto.measurement}` : ''
      }`,
    );

    return await this.ingredientsService.increaseQuantity(
      +id,
      updateQuantityDto,
    );
  }

  /**
   * Decrease ingredient quantity
   *
   * @param id Ingredient ID
   * @param updateQuantityDto Quantity update data
   * @returns Updated ingredient with warning flag
   */
  @Patch(':id/decrease')
  @ApiOperation({ summary: 'Decrease ingredient quantity' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient quantity has been successfully decreased.',
    schema: {
      type: 'object',
      properties: {
        ingredient: {
          oneOf: [{ $ref: getSchemaPath(IngredientResponseDto) }],
        },
        belowWarningThreshold: {
          type: 'boolean',
          description: 'Indicates if the quantity is below warning threshold',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found.',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid amount, insufficient quantity, incompatible measurement units, or other validation error.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to decrease ingredient quantity.',
  })
  async decreaseQuantity(
    @Param('id') id: string,
    @Body() updateQuantityDto: UpdateQuantityDto,
  ): Promise<{
    ingredient: IngredientResponseDto;
    belowWarningThreshold: boolean;
  }> {
    this.logger.log(
      `Decreasing quantity of ingredient ID: ${id} by ${updateQuantityDto.amount}${
        updateQuantityDto.measurement ? ` ${updateQuantityDto.measurement}` : ''
      }`,
    );

    return await this.ingredientsService.decreaseQuantity(
      +id,
      updateQuantityDto,
    );
  }
}
