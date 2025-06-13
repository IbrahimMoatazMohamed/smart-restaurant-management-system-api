import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
  Min,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MealStatus } from '../entities/meal.entity';
import { MealItemDto } from './meal-item.dto';
import { BadRequestException } from '@nestjs/common';

export class CreateMealDto {
  @ApiProperty({
    description: 'The name of the meal',
    example: 'Deluxe Burger Combo',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'The description of the meal' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The price of the meal',
    example: 15.99,
  })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  photo?: any;

  @ApiProperty({
    description: 'The status of the meal',
    enum: MealStatus,
    example: MealStatus.AVAILABLE,
    required: false,
  })
  @IsOptional()
  @IsEnum(MealStatus)
  status?: MealStatus;

  @ApiProperty({
    description: 'The category ID this meal belongs to',
    example: 1,
  })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  categoryId: number;

  @ApiProperty({
    description: 'The items with quantities included in this meal',
    type: [MealItemDto],
    required: false,
    example: [
      { itemId: 1, quantity: 100 },
      { itemId: 2, quantity: 50 },
    ],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        throw new BadRequestException('mealItems must be a valid JSON array');
      }
    }
    return value;
  })
  @Type(() => MealItemDto)
  mealItems?: MealItemDto[];
}
