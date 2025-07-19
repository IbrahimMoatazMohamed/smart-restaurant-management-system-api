import { Test, TestingModule } from '@nestjs/testing';
import { MealsService } from './meals.service';
import { Meal } from './entities/meal.entity';
import { MealItem } from '../meal-items/entities/meal-item.entity';
import { ItemsService } from '../items/items.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

const mockMealsRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  delete: jest.fn(),
};

const mockMealItemsRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
};

const mockItemsService = {
  findOne: jest.fn(),
};

const mockMenuCategoriesService = {
  findOne: jest.fn(),
};

const mockTenantRepositoryProvider = {
  getRepository: jest.fn().mockImplementation((entity) => {
    if (entity === Meal) {
      return Promise.resolve(mockMealsRepository);
    }
    if (entity === MealItem) {
      return Promise.resolve(mockMealItemsRepository);
    }
    return Promise.resolve({});
  }),
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
        {
          provide: TenantRepositoryProvider,
          useValue: mockTenantRepositoryProvider,
        },
        { provide: ItemsService, useValue: mockItemsService },
        { provide: MenuCategoriesService, useValue: mockMenuCategoriesService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<MealsService>(MealsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
