import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import Measurement from '../../ingredients/types/measurement.enum';

@Exclude()
export class ItemIngredientResponseDto {
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the item ingredient' })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'The ID of the item',
    example: 1,
  })
  item_id: number;

  @Expose()
  @ApiProperty({
    description: 'The ID of the ingredient',
    example: 1,
  })
  ingredient_id: number;

  @Expose()
  @ApiProperty({
    description: 'The quantity of the ingredient needed',
    example: 1.5,
  })
  qty: number;

  @Expose()
  @ApiProperty({
    description: 'The measurement unit of the ingredient',
    enum: Measurement,
    example: Measurement.KILOGRAM,
  })
  measurement: Measurement;
}
