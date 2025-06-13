import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Meal } from './meal.entity';
import { Item } from '../../items/entities/item.entity';

@Entity('meal_items')
export class MealItem {
  @PrimaryColumn({ name: 'meal_id' })
  @ApiProperty({ description: 'The ID of the meal' })
  mealId: number;

  @PrimaryColumn({ name: 'item_id' })
  @ApiProperty({ description: 'The ID of the item' })
  itemId: number;

  @Column({ default: 1 })
  @ApiProperty({
    description: 'The quantity of the item in the meal',
    example: 1,
    minimum: 1,
  })
  quantity: number;

  @ManyToOne(() => Meal, (meal) => meal.mealItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meal_id' })
  meal: Meal;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;
}
