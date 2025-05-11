import { Test, TestingModule } from '@nestjs/testing';
import { IngredientCategoriesController } from './ingredient-categories.controller';
import { IngredientCategoriesService } from './ingredient-categories.service';

describe('IngredientCategoriesController', () => {
  let controller: IngredientCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientCategoriesController],
      providers: [IngredientCategoriesService],
    }).compile();

    controller = module.get<IngredientCategoriesController>(
      IngredientCategoriesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
