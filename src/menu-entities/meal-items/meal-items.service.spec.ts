import { Test, TestingModule } from '@nestjs/testing';
import { MealItemsService } from './meal-items.service';

describe('MealItemsService', () => {
  let service: MealItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MealItemsService],
    }).compile();

    service = module.get<MealItemsService>(MealItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
