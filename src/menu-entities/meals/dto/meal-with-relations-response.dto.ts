import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { MenuCategory } from 'src/menu-entities/menu-categories/entities/menu-category.entity';
import { MealResponseDto } from './meal-response.dto';
import { ItemWithRelationsResponseDto } from 'src/menu-entities/items/dto/item-with-relations-response.dto';

@Exclude()
export class MealWithRelationsResponseDto extends MealResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The category this meal belongs to',
    type: () => MenuCategory,
    required: false,
  })
  category: MenuCategory;

  @Expose()
  @ApiProperty({
    description: 'The items included in this meal',
    type: () => ItemWithRelationsResponseDto,
  })
  items: ItemWithRelationsResponseDto[];
}
