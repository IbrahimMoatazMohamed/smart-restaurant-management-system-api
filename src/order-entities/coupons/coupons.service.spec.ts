import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

const mockCouponRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  preload: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
};

const mockTenantRepositoryProvider = {
  getRepository: jest
    .fn()
    .mockImplementation(() => Promise.resolve(mockCouponRepository)),
};

const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logError: jest.fn(),
};

describe('CouponsService', () => {
  let service: CouponsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: TenantRepositoryProvider,
          useValue: mockTenantRepositoryProvider,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = await module.resolve<CouponsService>(CouponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
