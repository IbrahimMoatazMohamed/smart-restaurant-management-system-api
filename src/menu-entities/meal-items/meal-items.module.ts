import { Module } from '@nestjs/common';
import { MealItemsService } from './meal-items.service';
import { MealItemsController } from './meal-items.controller';

@Module({
  controllers: [MealItemsController],
  providers: [MealItemsService],
})
export class MealItemsModule {}
