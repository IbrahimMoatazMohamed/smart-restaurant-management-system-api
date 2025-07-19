import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategoriesService } from './menu-categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuCategory } from './entities/menu-category.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

describe('MenuCategoriesService', () => {
  let service: MenuCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuCategoriesService,
        {
          provide: getRepositoryToken(MenuCategory),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            softDelete: jest.fn().mockResolvedValue({}),
            restore: jest.fn().mockResolvedValue({}),
            remove: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            logError: jest.fn(),
          },
        },
        {
          provide: TenantRepositoryProvider,
          useValue: {
            getRepository: jest.fn().mockResolvedValue({
              find: jest.fn().mockResolvedValue([]),
              findOne: jest.fn().mockResolvedValue({}),
              create: jest.fn().mockReturnValue({}),
              save: jest.fn().mockResolvedValue({}),
              update: jest.fn().mockResolvedValue({}),
              delete: jest.fn().mockResolvedValue({}),
              softDelete: jest.fn().mockResolvedValue({}),
              restore: jest.fn().mockResolvedValue({}),
              remove: jest.fn().mockResolvedValue({}),
            }),
          },
        },
      ],
    }).compile();

    service = await module.resolve<MenuCategoriesService>(
      MenuCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
