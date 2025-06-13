import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealItemsService } from './meal-items.service';
import { MealItemsController } from './meal-items.controller';
import { MealItem } from './entities/meal-item.entity';
import { MealsModule } from '../meals/meals.module';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MealItem]),
    forwardRef(() => MealsModule),
    ItemsModule,
  ],
  controllers: [MealItemsController],
  providers: [MealItemsService],
  exports: [MealItemsService],
})
export class MealItemsModule {}
