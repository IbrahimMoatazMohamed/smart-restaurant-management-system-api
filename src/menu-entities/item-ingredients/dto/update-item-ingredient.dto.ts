import { PartialType } from '@nestjs/mapped-types';
import { CreateItemIngredientDto } from './create-item-ingredient.dto';

export class UpdateItemIngredientDto extends PartialType(
  CreateItemIngredientDto,
) {}
