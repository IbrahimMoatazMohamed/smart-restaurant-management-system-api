import { ApiProperty } from '@nestjs/swagger';

export class OrderAnalyticsDto {
  @ApiProperty({
    description: 'Order status name',
    example: 'DELIVERED',
  })
  name: string;

  @ApiProperty({
    description: 'Count of orders with this status',
    example: 12,
  })
  value: number;
}
