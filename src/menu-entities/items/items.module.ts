import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { LoggerModule } from '../../logger/logger.module';
import { MenuCategoriesModule } from '../menu-categories/menu-categories.module';
import { ItemIngredientsModule } from '../item-ingredients/item-ingredients.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { FileUploadModule } from '../../file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item]),
    LoggerModule,
    MenuCategoriesModule,
    FileUploadModule,
    forwardRef(() => ItemIngredientsModule),
    forwardRef(() => IngredientsModule),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
