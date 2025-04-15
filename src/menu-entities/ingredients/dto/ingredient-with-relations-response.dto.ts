import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ItemIngredient } from 'src/menu-entities/item-ingredients/entities/item-ingredient.entity';
import { IngredientResponseDto } from './ingredient-response.dto';

@Exclude()
export class IngredientWithRelationsResponseDto extends IngredientResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The item ingredients associated with the ingredient',
    type: () => [ItemIngredient],
  })
  itemIngredients: ItemIngredient[];
}
