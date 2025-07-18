import { Module, forwardRef } from '@nestjs/common';
import { ItemIngredientsService } from './item-ingredients.service';
import { ItemIngredientsController } from './item-ingredients.controller';
import { LoggerModule } from '../../logger/logger.module';
import { ItemsModule } from '../items/items.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [
    LoggerModule,
    TenantModule,
    forwardRef(() => ItemsModule),
    forwardRef(() => IngredientsModule),
  ],
  controllers: [ItemIngredientsController],
  providers: [ItemIngredientsService],
  exports: [ItemIngredientsService],
})
export class ItemIngredientsModule {}
