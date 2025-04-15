import { Item } from 'src/menu-entities/items/entities/item.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ingredient } from 'src/menu-entities/ingredients/entities/ingredient.entity';
import Measurement from 'src/menu-entities/ingredients/types/measurement.enum';

@Entity('item_ingredients')
@Index(['item_id', 'ingredient_id'], { unique: true })
export class ItemIngredient {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the item ingredient' })
  id: number;

  @PrimaryColumn()
  @ApiProperty({
    description: 'The ID of the item',
    example: 1,
  })
  item_id: number;

  @PrimaryColumn()
  @ApiProperty({
    description: 'The ID of the ingredient',
    example: 1,
  })
  ingredient_id: number;

  @ManyToOne(() => Item, (item) => item.itemIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'item_id' })
  @ApiProperty({
    description: 'The item that uses this ingredient',
    type: () => Item,
  })
  item: Item;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.itemIngredients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ingredient_id' })
  @ApiProperty({
    description: 'The ingredient used in this item',
    type: () => Ingredient,
  })
  ingredient: Ingredient;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({
    description: 'The quantity of the ingredient needed',
    example: 1.5,
  })
  qty: number;

  @Column({ type: 'enum', enum: Measurement })
  @ApiProperty({
    description: 'The measurement unit of the ingredient',
    enum: Measurement,
    example: Measurement.KILOGRAM,
  })
  measurement: Measurement;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the meal was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the meal was last updated' })
  updatedAt: Date;
}
