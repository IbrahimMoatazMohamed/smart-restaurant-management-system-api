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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AdminOnly } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';


@ApiTags('meal-items')
@Controller('meal-items')
export class MealItemsController {
  constructor(private readonly mealItemsService: MealItemsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new meal item' })
  @ApiResponse({
    status: 201,
    description: 'The meal item has been successfully created.',
    type: MealItem,
  })
  create(@Body() createMealItemDto: CreateMealItemDto): Promise<MealItem> {
    return this.mealItemsService.create(createMealItemDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get()
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('deleted')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all soft-deleted meal items' })
  @ApiResponse({
    status: 200,
    description: 'Return all soft-deleted meal items',
    type: [MealItem],
  })
  findAllSoftDeleted(): Promise<MealItem[]> {
    return this.mealItemsService.findAllSoftDeleted();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get('meal/:mealId')
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Get(':mealId/:itemId')
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':mealId/:itemId')
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':mealId/:itemId')
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':mealId/:itemId/soft')
  @ApiBearerAuth('JWT-auth')
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post(':mealId/:itemId/restore')
  @ApiBearerAuth('JWT-auth')
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
