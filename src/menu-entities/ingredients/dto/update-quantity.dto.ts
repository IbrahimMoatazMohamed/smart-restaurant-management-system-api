import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import Measurement from '../types/measurement.enum';

export class UpdateQuantityDto {
  @ApiProperty({
    description: 'The amount to add or subtract from the quantity',
    example: 5.0,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'The measurement unit of the amount (optional)',
    enum: Measurement,
    example: Measurement.KILOGRAM,
    required: false,
  })
  @IsOptional()
  @IsEnum(Measurement)
  measurement?: Measurement;
}
