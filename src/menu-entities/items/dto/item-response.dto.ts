import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ItemStatus } from '../entities/item.entity';

@Exclude()
export class ItemResponseDto {
  @Expose()
  @ApiProperty({ description: 'The name of the item' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'The price of the item' })
  price: number;

  @Expose()
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  photo: string;

  @Expose()
  @ApiProperty({
    description: 'The status of the item',
    enum: ItemStatus,
    default: ItemStatus.AVAILABLE,
  })
  status?: ItemStatus;

  @Expose()
  @ApiProperty({
    description: 'The category ID this item belongs to',
    example: 1,
    required: false,
  })
  categoryId: number;
}
