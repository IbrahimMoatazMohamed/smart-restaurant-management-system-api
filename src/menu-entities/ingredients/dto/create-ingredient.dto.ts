import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import Measurement from '../types/measurement.enum';

export class CreateIngredientDto {
  @ApiProperty({
    description: 'The name of the ingredient',
    example: 'Tomato',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The quantity of the ingredient',
    example: 10.5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'The price per unit of the ingredient',
    example: 2.5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiProperty({
    description: 'The measurement unit of the ingredient',
    enum: Measurement,
    example: Measurement.KILOGRAM,
  })
  @IsNotEmpty()
  @IsEnum(Measurement)
  measurement: Measurement;

  @ApiProperty({
    description: 'The quantity at which to trigger a warning',
    example: 5.0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  warningAt: number;
}
