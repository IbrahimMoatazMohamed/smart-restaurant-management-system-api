/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ItemStatus } from '../entities/item.entity';
import { CreateItemIngredientDto } from '../../item-ingredients/dto/create-item-ingredient.dto';
import { BadRequestException } from '@nestjs/common';

export class CreateItemDto {
  @ApiProperty({ description: 'The name of the item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The price of the item' })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  })
  price: number;

  @ApiProperty({
    description: 'The description of the item',
    required: false,
  })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The list of ingredients required for this item',
    type: [CreateItemIngredientDto],
    required: false,
    example: [
      {
        ingredientId: 1,
        qty: 4,
        measurement: 'kg',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        throw new BadRequestException('ingredients must be a valid JSON array');
      }
    }
    return value;
  })
  @Type(() => CreateItemIngredientDto)
  ingredients?: CreateItemIngredientDto[];

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  photo?: string;

  @ApiProperty({
    description: 'The status of the item',
    enum: ItemStatus,
    default: ItemStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiProperty({
    description: 'The category ID this item belongs to',
    example: 1,
    required: false,
  })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => {
    return typeof value === 'string' ? parseInt(value, 10) : Number(value);
  })
  categoryId: number;
}
