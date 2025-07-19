import { Test, TestingModule } from '@nestjs/testing';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

describe('CouponsController', () => {
  let controller: CouponsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponsController],
      providers: [
        CouponsService,
        {
          provide: TenantRepositoryProvider,
          useValue: {
            getRepository: jest.fn().mockImplementation(() =>
              Promise.resolve({
                create: jest.fn(),
                save: jest.fn(),
                find: jest.fn(),
                findOne: jest.fn(),
                preload: jest.fn(),
                softDelete: jest.fn(),
                restore: jest.fn(),
              }),
            ),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CouponsController>(CouponsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
