import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  IsUrl,
  ValidateNested,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemStatus } from '../entities/item.entity';
import { CreateItemIngredientDto } from 'src/menu-entities/item-ingredients/dto/create-item-ingredient.dto';

export class CreateItemDto {
  @ApiProperty({ description: 'The name of the item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The price of the item' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'The list of ingredients required for this item',
    type: [CreateItemIngredientDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemIngredientDto)
  ingredients: CreateItemIngredientDto[];

  @ApiProperty({
    description: 'The photo URL of the item',
    required: false,
  })
  @IsNotEmpty()
  @IsUrl()
  photo: string;

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
  categoryId: number;
}
