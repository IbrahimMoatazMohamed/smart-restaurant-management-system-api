import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ItemIngredientsService } from './item-ingredients.service';
import { CreateItemIngredientDto } from './dto/create-item-ingredient.dto';
import { UpdateItemIngredientDto } from './dto/update-item-ingredient.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ItemIngredientWithRelationsResponseDto } from './dto/item-ingredients-with-relations-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminOnly } from '../../auth/decorators/roles.decorator';

/**
 * Item Ingredients Controller
 *
 * Handles operations related to item ingredients, including creation, retrieval,
 * update, and deletion of relationships between menu items and their ingredients.
 */
@ApiTags('item-ingredients')
@Controller('item-ingredients')
export class ItemIngredientsController {
  /**
   * Constructor
   *
   * Initializes the item ingredients service
   */
  constructor(
    private readonly itemIngredientsService: ItemIngredientsService,
  ) {}

  /**
   * Create a new item ingredient
   *
   * @param createItemIngredientDto Item ingredient creation data
   * @returns Created item ingredient
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new item ingredient' })
  @ApiBody({ type: CreateItemIngredientDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The item ingredient has been successfully created',
    type: ItemIngredientWithRelationsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiConflictResponse({
    description: 'Item ingredient already exists',
  })
  @ApiNotFoundResponse({
    description: 'Item or ingredient not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create item ingredient',
  })
  create(@Body() createItemIngredientDto: CreateItemIngredientDto) {
    return this.itemIngredientsService.create(createItemIngredientDto);
  }

  /**
   * Get all item ingredients
   *
   * @returns List of all item ingredients
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all item ingredients' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all item ingredients',
    type: [ItemIngredientWithRelationsResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve item ingredients',
  })
  findAll() {
    return this.itemIngredientsService.findAll();
  }

  /**
   * Get an item ingredient by ID
   *
   * @param id Item ingredient ID
   * @returns The found item ingredient
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get an item ingredient by ID' })
  @ApiParam({ name: 'id', description: 'Item ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found item ingredient',
    type: ItemIngredientWithRelationsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Item ingredient not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve item ingredient',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemIngredientsService.findOne(id);
  }

  /**
   * Get all ingredients for a specific item
   *
   * @param itemId Item ID
   * @returns List of ingredients for the specified item
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('item/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all ingredients for a specific item' })
  @ApiParam({ name: 'itemId', description: 'Item ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of ingredients for the specified item',
    type: [ItemIngredientWithRelationsResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Item not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve ingredients for the item',
  })
  findByItemId(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.itemIngredientsService.findByItemId(itemId);
  }

  /**
   * Get all items using a specific ingredient
   *
   * @param ingredientId Ingredient ID
   * @returns List of items using the specified ingredient
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('ingredient/:ingredientId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all items using a specific ingredient' })
  @ApiParam({ name: 'ingredientId', description: 'Ingredient ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of items using the specified ingredient',
    type: [ItemIngredientWithRelationsResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Ingredient not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve items using the ingredient',
  })
  findByIngredientId(
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ) {
    return this.itemIngredientsService.findByIngredientId(ingredientId);
  }

  /**
   * Update an item ingredient
   *
   * @param id Item ingredient ID
   * @param updateItemIngredientDto Item ingredient update data
   * @returns The updated item ingredient
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an item ingredient' })
  @ApiParam({ name: 'id', description: 'Item ingredient ID' })
  @ApiBody({ type: UpdateItemIngredientDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The item ingredient has been successfully updated',
    type: ItemIngredientWithRelationsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Item ingredient not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiConflictResponse({
    description: 'Item ingredient with the same properties already exists',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update item ingredient',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemIngredientDto: UpdateItemIngredientDto,
  ) {
    return this.itemIngredientsService.update(id, updateItemIngredientDto);
  }

  /**
   * Remove an item ingredient
   *
   * @param id Item ingredient ID
   * @returns Void
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove an item ingredient' })
  @ApiParam({ name: 'id', description: 'Item ingredient ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The item ingredient has been successfully removed',
  })
  @ApiNotFoundResponse({
    description: 'Item ingredient not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to remove item ingredient',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemIngredientsService.remove(id);
  }
}
