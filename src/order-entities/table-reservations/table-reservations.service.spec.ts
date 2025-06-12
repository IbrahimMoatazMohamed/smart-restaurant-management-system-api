import { Test, TestingModule } from '@nestjs/testing';
import { TableReservationsService } from './table-reservations.service';

describe('TableReservationsService', () => {
  let service: TableReservationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TableReservationsService],
    }).compile();

    service = module.get<TableReservationsService>(TableReservationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
