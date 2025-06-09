import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Meal } from '../../meals/entities/meal.entity';
import { MenuCategory } from '../../menu-categories/entities/menu-category.entity';
import { ItemIngredient } from 'src/menu-entities/item-ingredients/entities/item-ingredient.entity';

// Define the ItemStatus enum
export enum ItemStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  SEASONAL = 'seasonal',
  FEATURED = 'featured',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the item' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: 'The name of the item' })
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'The price of the item' })
  price: number;

  @Column()
  @ApiProperty({
    description: 'The photo URL of the item',
    required: false,
  })
  photo: string;

  @Column()
  @ApiProperty({
    description: 'The description of the item',
    required: false,
  })
  description: string;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.AVAILABLE,
  })
  @ApiProperty({
    description: 'The status of the item',
    enum: ItemStatus,
    example: ItemStatus.AVAILABLE,
  })
  status: ItemStatus;

  @ManyToOne(() => MenuCategory, (category) => category.items, {})
  @JoinColumn({ name: 'category_id' })
  @ApiProperty({
    description: 'The category this item belongs to',
    type: () => MenuCategory,
    required: false,
  })
  category: MenuCategory;

  @Column({ name: 'category_id' })
  @ApiProperty({
    description: 'The ID of the category this item belongs to',
    required: false,
  })
  categoryId: number;

  @ManyToMany(() => Meal, (meal) => meal.items)
  @ApiProperty({
    description: 'The meals that include this item',
    type: () => [Meal],
  })
  meals: Meal[];

  @OneToMany(() => ItemIngredient, (itemIngredient) => itemIngredient.item, {
    eager: true,
  })
  @ApiProperty({
    description: 'The ingredients associated with this item',
    type: () => [ItemIngredient],
  })
  itemIngredients: ItemIngredient[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the item was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the item was last updated' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @Column({ name: 'is_active', default: true })
  @ApiProperty({ description: 'Whether the item is active or not' })
  isActive: boolean;
}
