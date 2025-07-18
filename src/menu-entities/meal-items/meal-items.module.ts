import { Module, forwardRef } from '@nestjs/common';
import { MealItemsService } from './meal-items.service';
import { MealItemsController } from './meal-items.controller';
import { MealsModule } from '../meals/meals.module';
import { ItemsModule } from '../items/items.module';
import { LoggerModule } from '../../logger/logger.module';
import { TenantModule } from '../../tenant/tenant.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    LoggerModule,
    TenantModule,
    AuthModule,
    forwardRef(() => MealsModule),
    ItemsModule,
  ],
  controllers: [MealItemsController],
  providers: [MealItemsService],
  exports: [MealItemsService],
})
export class MealItemsModule {}
