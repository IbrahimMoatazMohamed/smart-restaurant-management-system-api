import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Meal } from '../../../menu-entities/meals/entities/meal.entity';
import { Item } from '../../../menu-entities/items/entities/item.entity';

export enum OrderItemType {
  MEAL = 'meal',
  ITEM = 'item',
}

@Entity('order_meal_items')
export class OrderMealItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @Column({ name: 'meal_id', nullable: true })
  mealId: number;

  @Column({ name: 'item_id', nullable: true })
  itemId: number;

  @Column({ type: 'enum', enum: OrderItemType })
  type: OrderItemType;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Order, (order) => order.orderMealItems)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Meal, { nullable: true })
  @JoinColumn({ name: 'meal_id' })
  meal: Meal | null;

  @ManyToOne(() => Item, { nullable: true })
  @JoinColumn({ name: 'item_id' })
  item: Item | null;
}
