import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealsService } from './meals.service';
import { Meal } from './entities/meal.entity';
import { ItemsService } from '../items/items.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { MealItemsService } from '../meal-items/meal-items.service';
import { CustomLoggerService } from '../../logger/logger.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  delete: jest.fn(),
});

const mockItemsService = {
  findOne: jest.fn(),
};

const mockMenuCategoriesService = {
  findOne: jest.fn(),
};

const mockMealItemsService = {
  findByMealId: jest.fn(),
  restore: jest.fn(),
  removeAllByMealId: jest.fn(),
};

const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logError: jest.fn(),
};

describe('MealsService', () => {
  let service: MealsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealsService,
        { provide: getRepositoryToken(Meal), useFactory: mockRepository },
        { provide: ItemsService, useValue: mockItemsService },
        { provide: MenuCategoriesService, useValue: mockMenuCategoriesService },
        { provide: MealItemsService, useValue: mockMealItemsService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<MealsService>(MealsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
