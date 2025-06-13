import { Test, TestingModule } from '@nestjs/testing';
import { MealItemsController } from './meal-items.controller';
import { MealItemsService } from './meal-items.service';

describe('MealItemsController', () => {
  let controller: MealItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealItemsController],
      providers: [MealItemsService],
    }).compile();

    controller = module.get<MealItemsController>(MealItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
