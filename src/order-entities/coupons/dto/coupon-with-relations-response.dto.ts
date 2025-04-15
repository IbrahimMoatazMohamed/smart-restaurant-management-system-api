import { ApiProperty } from '@nestjs/swagger';
import { CouponResponseDto } from './coupon-response.dto';
import { OrderResponseDto } from '../../orders/dto/order-response.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CouponWithRelationsResponseDto extends CouponResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Orders that used this coupon',
    type: [OrderResponseDto],
  })
  orders: OrderResponseDto[];
}
