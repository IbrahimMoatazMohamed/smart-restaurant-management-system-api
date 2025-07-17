import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { TableResponseDto } from './table-response.dto';
import { Order } from '../../orders/entities/order.entity';

@Exclude()
export class TableWithRelationsResponseDto extends TableResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The orders associated with this table',
    type: [Order],
  })
  orders: Order[];
}
