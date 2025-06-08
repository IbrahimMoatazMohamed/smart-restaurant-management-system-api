import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Users } from '../../../users/entities/users.entity';
import { Table } from '../../tables/entities/table.entity';
import { Coupon } from '../../coupons/entities/coupon.entity';
import { OrderMealItem } from './order-meal-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the order' })
  id: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  @ApiProperty({
    description: 'The status of the order',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({
    description: 'The total amount of the order',
    example: 45.99,
  })
  totalAmount: number;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Special instructions for the order',
    example: 'No onions please',
    required: false,
  })
  specialInstructions: string;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({
    description: 'The user who placed the order',
    type: () => Users,
  })
  user: Users;

  @Column({ name: 'user_id' })
  @ApiProperty({
    description: 'The ID of the user who placed the order',
    type: Number,
  })
  userId: number;

  @ManyToOne(() => Table, (table) => table.orders, { nullable: true })
  @JoinColumn({ name: 'table_id' })
  @ApiProperty({
    description: 'The table associated with this order',
    type: () => Table,
    required: false,
  })
  table: Table;

  @Column({ name: 'table_id', nullable: true })
  @ApiProperty({
    description: 'The ID of the table for the order',
    type: Number,
    required: false,
  })
  tableId: number;

  @OneToMany(() => OrderMealItem, (orderMealItem) => orderMealItem.order)
  @ApiProperty({
    description: 'The meal and item quantities in this order',
    type: [OrderMealItem],
  })
  orderMealItems: OrderMealItem[];

  @ManyToOne(() => Coupon, (coupon) => coupon.orders, { nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  @ApiProperty({
    description: 'The coupon associated with this order',
    type: () => Coupon,
    required: false,
  })
  coupon: Coupon;

  @Column({ name: 'coupon_id', nullable: true })
  @ApiProperty({
    description: 'The ID of the coupon applied to the order',
    type: Number,
    required: false,
  })
  couponId: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'When the order was created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'When the order was last updated' })
  updatedAt: Date;
}
