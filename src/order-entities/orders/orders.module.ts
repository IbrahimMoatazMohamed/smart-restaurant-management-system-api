import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderMealItem } from './entities/order-meal-item.entity';
import { UsersModule } from 'src/users/users.module';
import { MealsModule } from 'src/menu-entities/meals/meals.module';
import { ItemsModule } from 'src/menu-entities/items/items.module';
import { CouponsModule } from 'src/order-entities/coupons/coupons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderMealItem]),
    UsersModule,
    MealsModule,
    ItemsModule,
    CouponsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
