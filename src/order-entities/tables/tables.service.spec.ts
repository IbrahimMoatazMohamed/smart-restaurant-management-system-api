import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TablesService } from './tables.service';
import { Table } from './entities/table.entity';
import { CustomLoggerService } from '../../logger/logger.service';

const mockTableRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logError: jest.fn(),
};

describe('TablesService', () => {
  let service: TablesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        {
          provide: getRepositoryToken(Table),
          useValue: mockTableRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
