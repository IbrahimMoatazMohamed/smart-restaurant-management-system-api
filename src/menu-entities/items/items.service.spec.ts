import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { ItemIngredientsService } from '../item-ingredients/item-ingredients.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { CustomLoggerService } from '../../logger/logger.service';

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
          provide: getRepositoryToken(Item),
          useValue: createMockRepository(),
        },
        {
          provide: ItemIngredientsService,
          useValue: {
            upsert: jest.fn(),
            findByItemId: jest.fn(),
            removeByItemId: jest.fn(),
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

    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
