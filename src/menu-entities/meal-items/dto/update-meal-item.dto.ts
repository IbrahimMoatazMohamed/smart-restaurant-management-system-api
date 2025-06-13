import { PartialType } from '@nestjs/swagger';
import { CreateMealItemDto } from './create-meal-item.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMealItemDto extends PartialType(CreateMealItemDto) {
  @ApiProperty({
    description: 'The quantity of the item in the meal',
    example: 2,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
