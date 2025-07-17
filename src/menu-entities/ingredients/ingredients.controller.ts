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
  UseGuards,
  Query,
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { Ingredient } from './entities/ingredient.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { IngredientResponseDto } from './dto/ingredient-response.dto';
import { AdminOnly } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all ingredients' })
  @ApiQuery({
    name: 'withDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted ingredients',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all ingredients.',
    type: [IngredientResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve ingredients.',
  })
  async findAll(
    @Query('withDeleted') withDeleted?: string,
  ): Promise<Ingredient[]> {
    this.logger.log('Retrieving all ingredients');
    const includeDeleted = withDeleted === 'true';

    if (includeDeleted) {
      this.logger.log('Including soft-deleted ingredients');
      return await this.ingredientsService.findAllWithDeleted();
    }

    return await this.ingredientsService.findAll();
  }

  /**
   * Get an ingredient by ID
   *
   * @param id Ingredient ID
   * @returns Ingredient
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
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
    this.logger.log(`Soft deleting ingredient with ID: ${id}`);

    await this.ingredientsService.remove(+id);
  }

  /**
   * Restore a soft-deleted ingredient
   *
   * @param id Ingredient ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore a soft-deleted ingredient' })
  @ApiParam({ name: 'id', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ingredient has been successfully restored.',
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to restore ingredient.',
  })
  async restore(@Param('id') id: string): Promise<void> {
    this.logger.log(`Restoring ingredient with ID: ${id}`);

    await this.ingredientsService.restore(+id);
  }

  /**
   * Increase ingredient quantity
   *
   * @param id Ingredient ID
   * @param updateQuantityDto Quantity update data
   * @returns Updated ingredient
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':id/increase')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':id/decrease')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
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
