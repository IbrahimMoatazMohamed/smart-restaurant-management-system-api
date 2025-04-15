import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Order } from '../../order-entities/orders/entities/order.entity';
import { UserResponseDto } from './user-response.dto';

@Exclude()
export class UserWithRelationsResponseDto extends UserResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The orders placed by this user',
    type: [Order],
  })
  @Type(() => Order)
  orders: Order[];
}
