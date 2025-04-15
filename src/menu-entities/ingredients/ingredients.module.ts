import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { Ingredient } from './entities/ingredient.entity';
import { ItemIngredientsModule } from '../item-ingredients/item-ingredients.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient]), ItemIngredientsModule],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
