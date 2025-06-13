import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Ingredient } from 'src/menu-entities/ingredients/entities/ingredient.entity';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

@Entity('ingredient_categories')
export class IngredientCategory {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'The unique identifier of the ingredient category',
  })
  id: number;

  @Column({ unique: true })
  @ApiProperty({
    description: 'The name of the ingredient category',
    example: 'Dairy',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Description of the ingredient category',
    example: 'Dairy products like milk, cheese, etc.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;

  @Column({ default: true })
  @ApiProperty({
    description: 'Whether the ingredient category is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.category)
  @ApiProperty({
    description: 'The ingredients in this category',
    type: () => [Ingredient],
  })
  ingredients: Ingredient[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the ingredient category was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the ingredient category was last updated' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @ApiProperty({
    description: 'When the ingredient category was soft deleted',
    required: false,
  })
  deletedAt: Date | null;
}
