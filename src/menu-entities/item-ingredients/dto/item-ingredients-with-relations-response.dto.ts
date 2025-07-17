import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Item } from '../../items/entities/item.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';
import { ItemIngredientResponseDto } from './item-ingredients-response.dto';

@Exclude()
export class ItemIngredientWithRelationsResponseDto extends ItemIngredientResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The item that uses this ingredient',
    type: () => Item,
  })
  item: Item;

  @Expose()
  @ApiProperty({
    description: 'The ingredient used in this item',
    type: () => Ingredient,
  })
  ingredient: Ingredient;

  @Expose()
  @ApiProperty({ description: 'When the item ingredient was created' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'When the item ingredient was last updated' })
  updatedAt: Date;
}
