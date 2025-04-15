import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Users } from '../../../users/entities/users.entity';
import { Meal } from '../../../menu-entities/meals/entities/meal.entity';
import { Table } from '../../tables/entities/table.entity';
import { Item } from 'src/menu-entities/items/entities/item.entity';
import { Coupon } from 'src/order-entities/coupons/entities/coupon.entity';

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

  @ManyToOne(() => Users)
  @ApiProperty({
    description: 'The user who placed the order',
    type: () => Users,
  })
  user: Users;

  @Column()
  @ApiProperty({ description: 'The ID of the user who placed the order' })
  userId: number;

  @ManyToOne(() => Table, (table) => table.orders, { nullable: true })
  @ApiProperty({
    description: 'The table associated with this order',
    type: () => Table,
    required: false,
  })
  table: Table;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'The ID of the table for this order',
    required: false,
  })
  tableId: number;

  @ManyToMany(() => Meal)
  @JoinTable({
    name: 'order_meals',
    joinColumn: { name: 'order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'meal_id', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'The meals included in this order',
    type: [Meal],
  })
  meals: Meal[];

  @ManyToMany(() => Item)
  @JoinTable({
    name: 'order_items',
    joinColumn: { name: 'order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'item_id', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'The items included in this order',
    type: [Item],
  })
  items: Item[];

  @ManyToOne(() => Coupon, (coupon) => coupon.orders, { nullable: true })
  @ApiProperty({
    description: 'The coupon associated with this order',
    type: () => Coupon,
    required: false,
  })
  coupon: Coupon;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'The ID of the coupon for this order',
    required: false,
  })
  couponId: number;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the order was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the order was last updated' })
  updatedAt: Date;
}
