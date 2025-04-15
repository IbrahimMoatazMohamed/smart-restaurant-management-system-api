import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { MenuCategoryResponseDto } from './menu-category-response.dto';
import { ItemResponseDto } from 'src/menu-entities/items/dto/item-response.dto';
import { MealResponseDto } from 'src/menu-entities/meals/dto/meal-response.dto';

@Exclude()
export class MenuCategoryWithRelationsResponseDto extends MenuCategoryResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The items in this category',
    type: () => [ItemResponseDto],
  })
  items: ItemResponseDto[];

  @Expose()
  @ApiProperty({
    description: 'The meals in this category',
    type: () => [MealResponseDto],
  })
  meals: MealResponseDto[];
}
