import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { CouponType } from './coupon-type.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('coupons')
export class Coupon {
  @ApiProperty({ description: 'Unique identifier for the coupon' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Unique coupon code' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ description: 'Description of the coupon' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ description: 'Type of coupon (percentage, fixed, bogo)' })
  @Column({ type: 'enum', enum: CouponType, default: CouponType.PERCENTAGE })
  type: CouponType;

  @ApiProperty({
    description: 'Value of the coupon (percentage or fixed amount)',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @ApiProperty({
    description: 'Minimum order amount required to use the coupon',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrderAmount: number;

  @ApiProperty({ description: 'Maximum discount amount that can be applied' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscountAmount: number;

  @ApiProperty({ description: 'Start date of coupon validity' })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @ApiProperty({ description: 'Expiry date of coupon' })
  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @ApiProperty({ description: 'Maximum usage limit of the coupon' })
  @Column({ default: null, nullable: true })
  usageLimit: number;

  @ApiProperty({ description: 'Current usage count of the coupon' })
  @Column({ default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'Whether the coupon is active' })
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Order, (order) => order.coupon)
  @ApiProperty({ description: '' })
  orders: Order[];

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
