import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'The ID of the table for this order',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tableId?: number;

  @ApiProperty({
    description: 'The total amount of the order',
    example: 45.99,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Special instructions for the order',
    example: 'No onions please',
    required: false,
  })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({
    description: 'The ID of the user who placed the order',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Meals with quantities included in this order',
    example: [
      { mealId: 1, quantity: 2 },
      { mealId: 3, quantity: 1 },
    ],
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  mealItems?: { mealId: number; quantity: number }[];

  @ApiProperty({
    description: 'Menu items with quantities included in this order',
    example: [
      { itemId: 1, quantity: 2 },
      { itemId: 3, quantity: 1 },
    ],
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  menuItems?: { itemId: number; quantity: number }[];
}
