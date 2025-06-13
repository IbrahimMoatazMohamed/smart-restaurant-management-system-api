import { Test, TestingModule } from '@nestjs/testing';
import { IngredientCategoriesService } from './ingredient-categories.service';

describe('IngredientCategoriesService', () => {
  let service: IngredientCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngredientCategoriesService],
    }).compile();

    service = module.get<IngredientCategoriesService>(
      IngredientCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
