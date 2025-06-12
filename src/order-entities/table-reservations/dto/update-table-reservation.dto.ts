import { PartialType } from '@nestjs/swagger';
import { CreateTableReservationDto } from './create-table-reservation.dto';

export class UpdateTableReservationDto extends PartialType(
  CreateTableReservationDto,
) {}
