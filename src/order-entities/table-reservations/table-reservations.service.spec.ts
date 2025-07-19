import { Test, TestingModule } from '@nestjs/testing';
import { TableReservationsService } from './table-reservations.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

describe('TableReservationsService', () => {
  let service: TableReservationsService;

  beforeEach(async () => {
    const mockRepository = () => ({
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      remove: jest.fn().mockResolvedValue({}),
    });

    const mockTenantRepositoryProvider = {
      getRepository: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockRepository())),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableReservationsService,
        {
          provide: TenantRepositoryProvider,
          useValue: mockTenantRepositoryProvider,
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

    service = await module.resolve<TableReservationsService>(
      TableReservationsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
