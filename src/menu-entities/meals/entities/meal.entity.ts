import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Item } from 'src/menu-entities/items/entities/item.entity';
import { MenuCategory } from '../../menu-categories/entities/menu-category.entity';

// Define the MealStatus enum
export enum MealStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  SEASONAL = 'seasonal',
  FEATURED = 'featured',
}

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the meal' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: 'The name of the meal' })
  name: string;

  @Column()
  @ApiProperty({ description: 'The description of the meal' })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'The price of the meal' })
  price: number;

  @Column()
  @ApiProperty({ description: 'The photo of the meal' })
  photo: string;

  @Column({
    type: 'enum',
    enum: MealStatus,
    default: MealStatus.AVAILABLE,
  })
  @ApiProperty({
    description: 'The status of the meal',
    enum: MealStatus,
    example: MealStatus.AVAILABLE,
  })
  status: MealStatus;

  @ManyToOne(() => MenuCategory, (category) => category.meals, {})
  @JoinColumn({ name: 'category_id' })
  @ApiProperty({
    description: 'The category this meal belongs to',
    type: () => MenuCategory,
    required: false,
  })
  category: MenuCategory;

  @Column({ name: 'category_id' })
  @ApiProperty({
    description: 'The ID of the category this meal belongs to',
    required: false,
  })
  categoryId: number;

  @ManyToMany(() => Item)
  @JoinTable({
    name: 'meal_items',
    joinColumn: { name: 'meal_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'item_id', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'The items included in this meal',
    type: () => [Item],
  })
  items: Item[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the meal was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the meal was last updated' })
  updatedAt: Date;
}
