import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { LoggerModule } from '../../logger/logger.module';
import { MenuCategoriesModule } from '../menu-categories/menu-categories.module';
import { ItemIngredientsModule } from 'src/menu-entities/item-ingredients/item-ingredients.module';
import { IngredientsModule } from '../ingredients/ingredients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item]),
    LoggerModule,
    MenuCategoriesModule,
    forwardRef(() => ItemIngredientsModule),
    // ask
    forwardRef(() => IngredientsModule),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
