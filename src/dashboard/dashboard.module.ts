import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { LoggerModule } from '../logger/logger.module';
import { OrdersModule } from '../order-entities/orders/orders.module';
import { TablesModule } from '../order-entities/tables/tables.module';
import { MealsModule } from '../menu-entities/meals/meals.module';

@Module({
  imports: [LoggerModule, OrdersModule, TablesModule, MealsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
