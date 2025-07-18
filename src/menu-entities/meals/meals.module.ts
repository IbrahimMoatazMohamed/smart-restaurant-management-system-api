import { Module, forwardRef } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { ItemsModule } from '../items/items.module';
import { MenuCategoriesModule } from '../menu-categories/menu-categories.module';
import { LoggerModule } from '../../logger/logger.module';
import { FileUploadModule } from '../../file-upload/file-upload.module';
import { MealItemsModule } from '../meal-items/meal-items.module';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [
    TenantModule,
    forwardRef(() => ItemsModule),
    MenuCategoriesModule,
    LoggerModule,
    FileUploadModule,
    forwardRef(() => MealItemsModule),
  ],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
