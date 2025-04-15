import { Test, TestingModule } from '@nestjs/testing';
import { ItemIngredientsController } from './item-ingredients.controller';
import { ItemIngredientsService } from './item-ingredients.service';

describe('ItemIngredientsController', () => {
  let controller: ItemIngredientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemIngredientsController],
      providers: [ItemIngredientsService],
    }).compile();

    controller = module.get<ItemIngredientsController>(
      ItemIngredientsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
