import { Test, TestingModule } from '@nestjs/testing';
import { MealItemsController } from './meal-items.controller';
import { MealItemsService } from './meal-items.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MealItem } from './entities/meal-item.entity';
import { MealsService } from '../meals/meals.service';
import { ItemsService } from '../items/items.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

describe('MealItemsController', () => {
  let controller: MealItemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealItemsController],
      providers: [
        MealItemsService,
        {
          provide: getRepositoryToken(MealItem),
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
          provide: MealsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: ItemsService,
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
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<MealItemsController>(MealItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
