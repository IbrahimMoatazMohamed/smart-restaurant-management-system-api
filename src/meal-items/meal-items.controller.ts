import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MealItemsService } from './meal-items.service';
import { CreateMealItemDto } from './dto/create-meal-item.dto';
import { UpdateMealItemDto } from './dto/update-meal-item.dto';

@Controller('meal-items')
export class MealItemsController {
  constructor(private readonly mealItemsService: MealItemsService) {}

  @Post()
  create(@Body() createMealItemDto: CreateMealItemDto) {
    return this.mealItemsService.create(createMealItemDto);
  }

  @Get()
  findAll() {
    return this.mealItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mealItemsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMealItemDto: UpdateMealItemDto) {
    return this.mealItemsService.update(+id, updateMealItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mealItemsService.remove(+id);
  }
}
