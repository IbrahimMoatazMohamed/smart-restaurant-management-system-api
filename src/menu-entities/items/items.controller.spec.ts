import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemIngredientsService } from '../item-ingredients/item-ingredients.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { FileUploadService } from '../../file-upload/file-upload.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('ItemsController', () => {
  let controller: ItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        ItemsService,
        {
          provide: getRepositoryToken(Item),
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
          provide: ItemIngredientsService,
          useValue: {
            upsert: jest.fn().mockResolvedValue([]),
            findByItemId: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: MenuCategoriesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: IngredientsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({}),
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
          provide: FileUploadService,
          useValue: {
            getFileUrl: jest
              .fn()
              .mockReturnValue('http://example.com/image.jpg'),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ItemsController>(ItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
