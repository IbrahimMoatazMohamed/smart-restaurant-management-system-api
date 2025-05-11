import { PartialType } from '@nestjs/swagger';
import { CreateIngredientCategoryDto } from './create-ingredient-category.dto';

export class UpdateIngredientCategoryDto extends PartialType(
  CreateIngredientCategoryDto,
) {}
