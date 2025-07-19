import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';
import { ItemIngredient } from '../item-ingredients/entities/item-ingredient.entity';

type MockRepository = Partial<Record<keyof Repository<any>, jest.Mock>>;
const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
});

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: TenantRepositoryProvider,
          useValue: {
            getRepository: jest.fn().mockImplementation((entity) => {
              if (entity === Item) {
                return Promise.resolve(createMockRepository());
              }
              if (entity === ItemIngredient) {
                return Promise.resolve(createMockRepository());
              }
              return Promise.resolve(createMockRepository());
            }),
          },
        },
        {
          provide: MenuCategoriesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: IngredientsService,
          useValue: {
            findOne: jest.fn(),
            decreaseQuantity: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    service = await module.resolve<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
