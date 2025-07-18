import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UsersModule } from '../../users/users.module';
import { MealsModule } from '../../menu-entities/meals/meals.module';
import { ItemsModule } from '../../menu-entities/items/items.module';
import { CouponsModule } from '../coupons/coupons.module';
import { TablesModule } from '../tables/tables.module';
import { TenantModule } from '../../tenant/tenant.module';
import { LoggerModule } from '../../logger/logger.module';

@Module({
  imports: [
    TenantModule,
    LoggerModule,
    UsersModule,
    MealsModule,
    ItemsModule,
    CouponsModule,
    TablesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
