import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIngredientCategoryDto {
  @ApiProperty({
    description: 'The name of the ingredient category',
    example: 'Dairy',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the ingredient category',
    example: 'Milk-based ingredients and products',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
