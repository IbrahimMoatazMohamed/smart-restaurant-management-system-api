import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { Coupon } from './entities/coupon.entity';
import { CustomLoggerService } from '../../logger/logger.service';

const mockCouponRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  preload: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
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
          provide: getRepositoryToken(Coupon),
          useValue: mockCouponRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
