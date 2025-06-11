import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MealItemsService } from './meal-items.service';
import { CreateMealItemDto } from './dto/create-meal-item.dto';
import { UpdateMealItemDto } from './dto/update-meal-item.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MealItem } from './entities/meal-item.entity';

@ApiTags('meal-items')
@Controller('meal-items')
export class MealItemsController {
  constructor(private readonly mealItemsService: MealItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new meal item' })
  @ApiResponse({
    status: 201,
    description: 'The meal item has been successfully created.',
    type: MealItem,
  })
  create(@Body() createMealItemDto: CreateMealItemDto): Promise<MealItem> {
    return this.mealItemsService.create(createMealItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meal items' })
  @ApiResponse({
    status: 200,
    description: 'Return all meal items',
    type: [MealItem],
  })
  findAll(
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<MealItem[]> {
    return this.mealItemsService.findAll(includeDeleted);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted meal items' })
  @ApiResponse({
    status: 200,
    description: 'Return all soft-deleted meal items',
    type: [MealItem],
  })
  findAllSoftDeleted(): Promise<MealItem[]> {
    return this.mealItemsService.findAllSoftDeleted();
  }

  @Get('meal/:mealId')
  @ApiOperation({ summary: 'Get all meal items for a specific meal' })
  @ApiParam({ name: 'mealId', description: 'ID of the meal' })
  @ApiResponse({
    status: 200,
    description: 'Return all meal items for the specified meal',
    type: [MealItem],
  })
  findByMealId(
    @Param('mealId', ParseIntPipe) mealId: number,
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<MealItem[]> {
    return this.mealItemsService.findByMealId(mealId, includeDeleted);
  }

  @Get(':mealId/:itemId')
  @ApiOperation({ summary: 'Get a specific meal item' })
  @ApiParam({ name: 'mealId', description: 'ID of the meal' })
  @ApiParam({ name: 'itemId', description: 'ID of the item' })
  @ApiResponse({
    status: 200,
    description: 'Return the specified meal item',
    type: MealItem,
  })
  findOne(
    @Param('mealId', ParseIntPipe) mealId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<MealItem> {
    return this.mealItemsService.findOne(mealId, itemId);
  }

  @Patch(':mealId/:itemId')
  @ApiOperation({ summary: 'Update a meal item' })
  @ApiParam({ name: 'mealId', description: 'ID of the meal' })
  @ApiParam({ name: 'itemId', description: 'ID of the item' })
  @ApiResponse({
    status: 200,
    description: 'The meal item has been successfully updated.',
    type: MealItem,
  })
  update(
    @Param('mealId', ParseIntPipe) mealId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateMealItemDto: UpdateMealItemDto,
  ): Promise<MealItem> {
    return this.mealItemsService.update(mealId, itemId, updateMealItemDto);
  }

  @Delete(':mealId/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete a meal item' })
  @ApiParam({ name: 'mealId', description: 'ID of the meal' })
  @ApiParam({ name: 'itemId', description: 'ID of the item' })
  @ApiResponse({
    status: 204,
    description: 'The meal item has been successfully removed.',
  })
  remove(
    @Param('mealId', ParseIntPipe) mealId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<void> {
    return this.mealItemsService.remove(mealId, itemId);
  }

  @Delete(':mealId/:itemId/soft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a meal item' })
  @ApiParam({ name: 'mealId', description: 'ID of the meal' })
  @ApiParam({ name: 'itemId', description: 'ID of the item' })
  @ApiResponse({
    status: 204,
    description: 'The meal item has been successfully soft-deleted.',
  })
  softDelete(
    @Param('mealId', ParseIntPipe) mealId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<void> {
    return this.mealItemsService.softDelete(mealId, itemId);
  }

  @Post(':mealId/:itemId/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted meal item' })
  @ApiParam({ name: 'mealId', description: 'ID of the meal' })
  @ApiParam({ name: 'itemId', description: 'ID of the item' })
  @ApiResponse({
    status: 200,
    description: 'The meal item has been successfully restored.',
    type: MealItem,
  })
  restore(
    @Param('mealId', ParseIntPipe) mealId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<MealItem> {
    return this.mealItemsService.restore(mealId, itemId);
  }
}
