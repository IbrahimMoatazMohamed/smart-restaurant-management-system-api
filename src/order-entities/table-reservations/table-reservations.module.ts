import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableReservationsService } from './table-reservations.service';
import { TableReservationsController } from './table-reservations.controller';
import { TableReservation } from './entities/table-reservation.entity';
import { Table } from '../tables/entities/table.entity';
import { LoggerModule } from '../../logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([TableReservation, Table]), LoggerModule],
  controllers: [TableReservationsController],
  providers: [TableReservationsService],
  exports: [TableReservationsService],
})
export class TableReservationsModule {}
