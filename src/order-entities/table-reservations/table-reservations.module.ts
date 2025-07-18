import { Module } from '@nestjs/common';
import { TableReservationsService } from './table-reservations.service';
import { TableReservationsController } from './table-reservations.controller';
import { LoggerModule } from '../../logger/logger.module';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [LoggerModule, TenantModule],
  controllers: [TableReservationsController],
  providers: [TableReservationsService],
  exports: [TableReservationsService],
})
export class TableReservationsModule {}
