import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, plainToClass } from 'class-transformer';
import { MenuCategory } from '../entities/menu-category.entity';

@Exclude()
export class MenuCategoryResponseDto {
  constructor(partial: Partial<MenuCategory>) {
    Object.assign(this, plainToClass(MenuCategoryResponseDto, partial));
  }
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the menu category' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'The name of the menu category' })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'The description of the menu category',
    required: false,
  })
  description: string;

  @Expose()
  @ApiProperty({
    description: 'Whether the menu category is active',
    example: true,
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({ description: 'When the menu category was created' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'When the menu category was last updated' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ description: 'The number of items in this category' })
  @Transform(({ obj }) => {
    // Type assertion to avoid unsafe member access
    if (obj && typeof obj === 'object' && 'items' in obj) {
      const items = (obj as { items?: unknown[] }).items;
      return items?.length || 0;
    }
    return 0;
  })
  itemsCount: number = 0;
}
