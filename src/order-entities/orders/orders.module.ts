import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderMealItem } from './entities/order-meal-item.entity';
import { UsersModule } from '../../users/users.module';
import { MealsModule } from '../../menu-entities/meals/meals.module';
import { ItemsModule } from '../../menu-entities/items/items.module';
import { CouponsModule } from '../../order-entities/coupons/coupons.module';
import { TablesModule } from '../../order-entities/tables/tables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderMealItem]),
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
