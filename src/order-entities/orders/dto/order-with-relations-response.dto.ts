import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { OrderResponseDto } from './order-response.dto';
import { Table } from 'typeorm';
import { MealResponseDto } from '../../../menu-entities/meals/dto/meal-response.dto';
import { ItemResponseDto } from '../../../menu-entities/items/dto/item-response.dto';
import { Users } from '../../../users/entities/users.entity';
import { Coupon } from '../../../order-entities/coupons/entities/coupon.entity';

@Exclude()
export class OrderWithRelationsResponseDto extends OrderResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The table associated with this order',
    type: () => Table,
    required: false,
  })
  table: Table;

  @Expose()
  @ApiProperty({
    description: 'The meals included in this order',
    type: [MealResponseDto],
  })
  meals: MealResponseDto[];

  @Expose()
  @ApiProperty({
    description: 'The items included in this order',
    type: [ItemResponseDto],
  })
  items: ItemResponseDto[];

  @Expose()
  @ApiProperty({
    description: 'The user who placed the order',
    type: () => Users,
  })
  user: Users;

  @Expose()
  @ApiProperty({
    description: 'The coupon associated with this order',
    type: () => Coupon,
    required: false,
  })
  coupon: Coupon;
}
