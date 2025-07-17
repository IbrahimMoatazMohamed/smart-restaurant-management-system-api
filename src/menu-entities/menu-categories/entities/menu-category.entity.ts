import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Item } from '../../items/entities/item.entity';
import { Meal } from '../../meals/entities/meal.entity';

@Entity('menu_categories')
export class MenuCategory {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the menu category' })
  id: number;

  @Column({ unique: true })
  @ApiProperty({ description: 'The name of the menu category' })
  name: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'The description of the menu category',
    required: false,
  })
  description: string;

  @Column({ default: true })
  @ApiProperty({
    description: 'Whether the menu category is active',
    example: true,
  })
  isActive: boolean;

  @OneToMany(() => Item, (item) => item.category)
  @ApiProperty({
    description: 'The items in this category',
    type: () => [Item],
  })
  items: Item[];

  @OneToMany(() => Meal, (meal) => meal.category)
  @ApiProperty({
    description: 'The meals in this category',
    type: () => [Meal],
  })
  meals: Meal[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the menu category was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the menu category was last updated' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @ApiProperty({
    description: 'When the menu category was deleted (soft delete)',
    required: false,
  })
  deletedAt: Date;
}
