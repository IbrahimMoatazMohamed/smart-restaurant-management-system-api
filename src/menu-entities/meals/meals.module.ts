import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { Meal } from './entities/meal.entity';
import { MealItem } from './entities/meal-item.entity';
import { LoggerModule } from '../../logger/logger.module';
import { ItemsModule } from 'src/menu-entities/items/items.module';
import { MenuCategoriesModule } from 'src/menu-entities/menu-categories/menu-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, MealItem]),
    LoggerModule,
    ItemsModule,
    MenuCategoriesModule,
  ],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
