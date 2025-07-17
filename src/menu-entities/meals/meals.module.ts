import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { Meal } from './entities/meal.entity';
import { MealItem } from './entities/meal-item.entity';
import { LoggerModule } from '../../logger/logger.module';
import { ItemsModule } from '../items/items.module';
import { MenuCategoriesModule } from '../menu-categories/menu-categories.module';
import { FileUploadModule } from '../../file-upload/file-upload.module';
import { MealItemsModule } from '../meal-items/meal-items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, MealItem]),
    LoggerModule,
    ItemsModule,
    MenuCategoriesModule,
    FileUploadModule,
    forwardRef(() => MealItemsModule),
  ],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
