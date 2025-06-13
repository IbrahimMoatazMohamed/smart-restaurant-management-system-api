import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { CreateIngredientCategoryDto } from './dto/create-ingredient-category.dto';
import { UpdateIngredientCategoryDto } from './dto/update-ingredient-category.dto';
import { IngredientCategory } from './entities/ingredient-category.entity';

@ApiTags('ingredient-categories')
@Controller('ingredient-categories')
export class IngredientCategoriesController {
  constructor(
    private readonly ingredientCategoriesService: IngredientCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ingredient category' })
  @ApiBody({ type: CreateIngredientCategoryDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The ingredient category has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ingredient category with the same name already exists.',
  })
  create(@Body() createIngredientCategoryDto: CreateIngredientCategoryDto) {
    return this.ingredientCategoriesService.create(createIngredientCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ingredient categories' })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted ingredient categories',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by ingredient category name',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: String,
    description: 'Filter by ingredient category description',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of ingredient categories returned successfully.',
  })
  findAll(
    @Query('includeDeleted') includeDeleted?: string,
    @Query('name') name?: string,
    @Query('description') description?: string,
  ) {
    return this.ingredientCategoriesService.findAll(
      includeDeleted === 'true',
      name,
      description,
    );
  }

  @Get('soft-deleted')
  @ApiOperation({ summary: 'Get all soft-deleted ingredient categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all soft-deleted ingredient categories',
    type: [IngredientCategory],
  })
  findAllSoftDeleted() {
    return this.ingredientCategoriesService.findAllSoftDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific ingredient category by ID' })
  @ApiParam({ name: 'id', description: 'Ingredient category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The ingredient category has been found and returned.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient category with the provided ID was not found.',
  })
  findOne(@Param('id') id: string) {
    // Validate that id is a valid number
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
    }
    return this.ingredientCategoriesService.findOne(categoryId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an ingredient category' })
  @ApiParam({ name: 'id', description: 'Ingredient category ID' })
  @ApiBody({ type: UpdateIngredientCategoryDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The ingredient category has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient category with the provided ID was not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ingredient category with the same name already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ingredient category ID provided.',
  })
  update(
    @Param('id') id: string,
    @Body() updateIngredientCategoryDto: UpdateIngredientCategoryDto,
  ) {
    // Validate that id is a valid number
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
    }
    return this.ingredientCategoriesService.update(
      categoryId,
      updateIngredientCategoryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an ingredient category (hard delete)' })
  @ApiParam({ name: 'id', description: 'Ingredient category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The ingredient category has been successfully removed.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient category with the provided ID was not found.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Cannot delete ingredient category that has associated ingredients.',
  })
  remove(@Param('id') id: string) {
    // Validate that id is a valid number
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
    }
    return this.ingredientCategoriesService.remove(categoryId);
  }

  @Delete(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete an ingredient category' })
  @ApiParam({ name: 'id', description: 'Ingredient category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The ingredient category has been successfully soft deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient category with the provided ID was not found.',
  })
  softDelete(@Param('id') id: string) {
    // Validate that id is a valid number
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
    }
    return this.ingredientCategoriesService.softDelete(categoryId);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted ingredient category' })
  @ApiParam({ name: 'id', description: 'Ingredient category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The ingredient category has been successfully restored.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ingredient category with the provided ID was not found.',
  })
  restore(@Param('id') id: string) {
    // Validate that id is a valid number
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
    }
    return this.ingredientCategoriesService.restore(categoryId);
  }
}
