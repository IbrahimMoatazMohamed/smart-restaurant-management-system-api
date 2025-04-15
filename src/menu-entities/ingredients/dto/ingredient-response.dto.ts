import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import Measurement from '../types/measurement.enum';

@Exclude()
export class IngredientResponseDto {
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the ingredient' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'The name of the ingredient' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'The stock level of the ingredient' })
  stock: number;

  @Expose()
  @ApiProperty({ description: 'The price per unit of the ingredient' })
  pricePerUnit: number;

  @Expose()
  @ApiProperty({
    description: 'The measurement unit of the ingredient',
    enum: Measurement,
    example: Measurement.KILOGRAM,
  })
  measurement: Measurement;

  @Expose()
  @ApiProperty({ description: 'The quantity at which to trigger a warning' })
  warningAt: number;

  @Expose()
  @ApiProperty({ description: 'The creation date of the ingredient record' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'The last update date of the ingredient record' })
  updatedAt: Date;
}
