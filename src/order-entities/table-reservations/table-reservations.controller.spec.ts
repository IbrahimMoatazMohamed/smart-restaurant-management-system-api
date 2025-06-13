import { Test, TestingModule } from '@nestjs/testing';
import { TableReservationsController } from './table-reservations.controller';
import { TableReservationsService } from './table-reservations.service';

describe('TableReservationsController', () => {
  let controller: TableReservationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TableReservationsController],
      providers: [TableReservationsService],
    }).compile();

    controller = module.get<TableReservationsController>(
      TableReservationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
