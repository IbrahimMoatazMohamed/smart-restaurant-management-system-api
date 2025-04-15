import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { CreateItemIngredientDto } from 'src/menu-entities/item-ingredients/dto/create-item-ingredient.dto';
import { ItemResponseDto } from './item-response.dto';

@Exclude()
export class ItemWithRelationsResponseDto extends ItemResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The list of ingredients required for this item',
    type: [CreateItemIngredientDto],
  })
  ingredients: CreateItemIngredientDto[];
}
