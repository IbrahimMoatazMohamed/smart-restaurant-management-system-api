import { Test, TestingModule } from '@nestjs/testing';
import { ItemIngredientsService } from './item-ingredients.service';

describe('ItemIngredientsService', () => {
  let service: ItemIngredientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemIngredientsService],
    }).compile();

    service = module.get<ItemIngredientsService>(ItemIngredientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
