import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealItemsService } from './meal-items.service';
import { MealItem } from './entities/meal-item.entity';
import { MealsService } from '../meals/meals.service';
import { ItemsService } from '../items/items.service';
import { CustomLoggerService } from '../../logger/logger.service';

// Create mock repository factory
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  remove: jest.fn(),
};

// Create mock services
const mockMealsService = {
  findOne: jest.fn(),
};

const mockItemsService = {
  findOne: jest.fn(),
};

const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  logError: jest.fn(),
};

describe('MealItemsService', () => {
  let service: MealItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealItemsService,
        {
          provide: getRepositoryToken(MealItem),
          useValue: mockRepository,
        },
        {
          provide: MealsService,
          useValue: mockMealsService,
        },
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<MealItemsService>(MealItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
