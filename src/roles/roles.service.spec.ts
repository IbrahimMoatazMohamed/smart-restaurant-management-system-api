import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { CustomLoggerService } from '../logger/logger.service';
import { DataSource } from 'typeorm';

describe('RolesService', () => {
  let service: RolesService;
  let mockRolesRepository: Record<string, jest.Mock>;
  let mockLogger: Record<string, jest.Mock>;
  let mockDataSource: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockRolesRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      logError: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        save: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
