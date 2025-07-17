import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderMealItem } from './entities/order-meal-item.entity';
import { UsersService } from '../../users/users.service';
import { MealsService } from '../../menu-entities/meals/meals.service';
import { ItemsService } from '../../menu-entities/items/items.service';
import { CouponsService } from '../coupons/coupons.service';
import { TablesService } from '../tables/tables.service';
import { CustomLoggerService } from '../../logger/logger.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
});

const mockUsersService = {
  findOne: jest.fn(),
};

const mockMealsService = {
  findOne: jest.fn(),
};

const mockItemsService = {
  findOne: jest.fn(),
};

const mockCouponsService = {
  findOne: jest.fn(),
};

const mockTablesService = {
  findOne: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      delete: jest.fn(),
    },
  })),
};

const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logError: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  // Repository is injected but not used in tests yet

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockRepository },
        {
          provide: getRepositoryToken(OrderMealItem),
          useFactory: mockRepository,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MealsService, useValue: mockMealsService },
        { provide: ItemsService, useValue: mockItemsService },
        { provide: CouponsService, useValue: mockCouponsService },
        { provide: TablesService, useValue: mockTablesService },
        { provide: DataSource, useValue: mockDataSource },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
