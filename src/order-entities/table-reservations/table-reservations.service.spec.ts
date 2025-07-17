import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { TableReservationsService } from './table-reservations.service';
import { TableReservation } from './entities/table-reservation.entity';
import { Table } from '../tables/entities/table.entity';
import { CustomLoggerService } from '../../logger/logger.service';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('TableReservationsService', () => {
  let service: TableReservationsService;
  // These repositories are used in more advanced tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let tableReservationRepository: MockRepository;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let tableRepository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableReservationsService,
        {
          provide: getRepositoryToken(TableReservation),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            remove: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: getRepositoryToken(Table),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
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
      ],
    }).compile();

    service = module.get<TableReservationsService>(TableReservationsService);
    tableReservationRepository = module.get<MockRepository>(
      getRepositoryToken(TableReservation),
    );
    tableRepository = module.get<MockRepository>(getRepositoryToken(Table));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
