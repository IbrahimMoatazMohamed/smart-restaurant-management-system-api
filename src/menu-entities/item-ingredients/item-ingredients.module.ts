import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemIngredientsService } from './item-ingredients.service';
import { ItemIngredientsController } from './item-ingredients.controller';
import { ItemIngredient } from './entities/item-ingredient.entity';
import { LoggerModule } from '../../logger/logger.module';
import { ItemsModule } from '../items/items.module';
import { IngredientsModule } from '../ingredients/ingredients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItemIngredient]),
    LoggerModule,
    ItemsModule,
    forwardRef(() => IngredientsModule),
  ],
  controllers: [ItemIngredientsController],
  providers: [ItemIngredientsService],
  exports: [ItemIngredientsService],
})
export class ItemIngredientsModule {}
