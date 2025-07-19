import { Test, TestingModule } from '@nestjs/testing';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Meal } from './entities/meal.entity';
import { ItemsService } from '../items/items.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { MealItemsService } from '../meal-items/meal-items.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { ImageUploadHelper } from '../../file-upload/helpers/image-upload.helper';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

describe('MealsController', () => {
  let controller: MealsController;
  let service: MealsService;

  const mockMealRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    delete: jest.fn(),
  };

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

  const mockCustomLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    logError: jest.fn(),
  };

  const mockImageUploadHelper = {
    extractImageUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealsController],
      providers: [
        MealsService,
        {
          provide: getRepositoryToken(Meal),
          useValue: mockMealRepository,
        },
        {
          provide: ItemsService,
          useValue: mockItemsService,
        },
        {
          provide: MenuCategoriesService,
          useValue: mockMenuCategoriesService,
        },
        {
          provide: MealItemsService,
          useValue: mockMealItemsService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLoggerService,
        },
        {
          provide: ImageUploadHelper,
          useValue: mockImageUploadHelper,
        },
        {
          provide: TenantRepositoryProvider,
          useValue: {
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
          },
        },
      ],
    }).compile();

    controller = module.get<MealsController>(MealsController);
    service = await module.resolve<MealsService>(MealsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });
});
