import { Module } from '@nestjs/common';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { IngredientCategoriesController } from './ingredient-categories.controller';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { TenantModule } from '../../tenant/tenant.module';
import { LoggerModule } from '../../logger/logger.module';

@Module({
  imports: [TenantModule, IngredientsModule, LoggerModule],
  controllers: [IngredientCategoriesController],
  providers: [IngredientCategoriesService],
  exports: [IngredientCategoriesService],
})
export class IngredientCategoriesModule {}
