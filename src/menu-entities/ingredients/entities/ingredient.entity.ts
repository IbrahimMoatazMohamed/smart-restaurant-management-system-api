import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import Measurement from '../types/measurement.enum';
import { ItemIngredient } from '../../item-ingredients/entities/item-ingredient.entity';
import { IngredientCategory } from '../../ingredient-categories/entities/ingredient-category.entity';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the ingredient' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: 'The name of the ingredient' })
  name: string;

  @Column('decimal', { precision: 14, scale: 4 })
  @ApiProperty({ description: 'The stock level of the ingredient' })
  stock: number;

  @Column('decimal', { precision: 14, scale: 4 })
  @ApiProperty({ description: 'The price per unit of the ingredient' })
  pricePerUnit: number;

  @Column({ type: 'enum', enum: Measurement })
  @ApiProperty({
    description: 'The measurement unit of the ingredient',
    enum: Measurement,
    example: Measurement.KILOGRAM,
  })
  measurement: Measurement;

  @Column('decimal', { precision: 14, scale: 4 })
  @ApiProperty({ description: 'The quantity at which to trigger a warning' })
  warningAt: number;

  @OneToMany(
    () => ItemIngredient,
    (itemIngredient) => itemIngredient.ingredient,
  )
  @ApiProperty({
    description: 'The item ingredients associated with the ingredient',
    type: () => [ItemIngredient],
  })
  itemIngredients: ItemIngredient[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'The creation date of the ingredient record' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'The last update date of the ingredient record' })
  updatedAt: Date;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'The ID of the category this ingredient belongs to',
  })
  categoryId: number;

  @ManyToOne(() => IngredientCategory, (category) => category.ingredients)
  @JoinColumn({ name: 'categoryId' })
  @ApiProperty({
    description: 'The category this ingredient belongs to',
    type: () => IngredientCategory,
  })
  category: IngredientCategory;
}
