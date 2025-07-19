import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TableReservationsController } from './table-reservations.controller';
import { TableReservationsService } from './table-reservations.service';
import { TableReservation } from './entities/table-reservation.entity';
import { Table } from '../tables/entities/table.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

const mockTableReservationRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockTableRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
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
    }),
  ),
};

describe('TableReservationsController', () => {
  let controller: TableReservationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TableReservationsController],
      providers: [
        TableReservationsService,
        {
          provide: getRepositoryToken(TableReservation),
          useValue: mockTableReservationRepository,
        },
        {
          provide: getRepositoryToken(Table),
          useValue: mockTableRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: TenantRepositoryProvider,
          useValue: mockTenantRepositoryProvider,
        },
      ],
    }).compile();

    controller = module.get<TableReservationsController>(
      TableReservationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
