import { Test, TestingModule } from '@nestjs/testing';
import { MenuCategoriesController } from './menu-categories.controller';
import { MenuCategoriesService } from './menu-categories.service';
import { MenuCategory } from './entities/menu-category.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';
import { Repository } from 'typeorm';

describe('MenuCategoriesController', () => {
  let controller: MenuCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuCategoriesController],
      providers: [
        MenuCategoriesService,
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
            } as Partial<Repository<MenuCategory>>),
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
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<MenuCategoriesController>(MenuCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
