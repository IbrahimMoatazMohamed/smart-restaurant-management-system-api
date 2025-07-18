import { Module } from '@nestjs/common';
import { TenantModule } from '../../tenant/tenant.module';
import { LoggerModule } from '../../logger/logger.module';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { ItemIngredientsModule } from '../item-ingredients/item-ingredients.module';

@Module({
  imports: [TenantModule, LoggerModule, ItemIngredientsModule],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
