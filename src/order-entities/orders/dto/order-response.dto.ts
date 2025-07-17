import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { OrderStatus, OrderType } from '../entities/order.entity';

@Exclude()
export class OrderResponseDto {
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the order' })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'The status of the order',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Expose()
  @ApiProperty({
    description: 'The type of order (dine-in or takeaway)',
    enum: OrderType,
    example: OrderType.DINE_IN,
  })
  orderType: OrderType;

  @Expose()
  @ApiProperty({
    description: 'The total amount of the order',
    example: 45.99,
  })
  totalAmount: number;

  @Expose()
  @ApiProperty({
    description: 'Special instructions for the order',
    example: 'No onions please',
    required: false,
  })
  specialInstructions: string;

  @Expose()
  @ApiProperty({ description: 'The ID of the user who placed the order' })
  userId: number;

  @Expose()
  @ApiProperty({
    description: 'The ID of the table for this order',
    required: false,
  })
  tableId: number;

  @Expose()
  @ApiProperty({ description: 'When the order was created' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'When the order was last updated' })
  updatedAt: Date;
}
