import { Test, TestingModule } from '@nestjs/testing';
import { MealItemsService } from './meal-items.service';
import { MealsService } from '../meals/meals.service';
import { ItemsService } from '../items/items.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

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

const mockTenantRepositoryProvider = {
  getRepository: jest.fn().mockImplementation(() =>
    Promise.resolve({
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    }),
  ),
};

describe('MealItemsService', () => {
  let service: MealItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealItemsService,
        {
          provide: TenantRepositoryProvider,
          useValue: mockTenantRepositoryProvider,
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

    service = await module.resolve<MealItemsService>(MealItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
