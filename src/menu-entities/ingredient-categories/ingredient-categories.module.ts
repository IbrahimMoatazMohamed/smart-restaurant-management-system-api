import { Module } from '@nestjs/common';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { IngredientCategoriesController } from './ingredient-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientCategory } from './entities/ingredient-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IngredientCategory])],
  controllers: [IngredientCategoriesController],
  providers: [IngredientCategoriesService],
})
export class IngredientCategoriesModule {}
