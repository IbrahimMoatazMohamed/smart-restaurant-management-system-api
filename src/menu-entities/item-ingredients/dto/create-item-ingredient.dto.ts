import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import Measurement from '../../ingredients/types/measurement.enum';

export class CreateItemIngredientDto {
  @ApiProperty({ description: 'The ID of the ingredient' })
  @IsNumber()
  @Min(1)
  ingredientId: number;

  @ApiProperty({ description: 'The ID of the item' })
  @IsNumber()
  @Min(1)
  itemId: number;

  @ApiProperty({ description: 'The quantity of the ingredient needed' })
  @IsNumber()
  @Min(0)
  qty: number;

  @ApiProperty({
    description: 'The measurement unit of the ingredient',
    enum: Measurement,
  })
  @IsEnum(Measurement)
  measurement: Measurement;
}
