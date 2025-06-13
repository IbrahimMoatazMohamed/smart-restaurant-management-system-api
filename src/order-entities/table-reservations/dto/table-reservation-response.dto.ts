import { ApiProperty } from '@nestjs/swagger';
import {
  ReservationStatus,
  TableReservation,
} from '../entities/table-reservation.entity';
import { Table } from '../../tables/entities/table.entity';
import { Users } from '../../../users/entities/users.entity';

export class TableReservationResponseDto {
  @ApiProperty({ description: 'The unique identifier of the reservation' })
  id: number;

  @ApiProperty({ description: 'The table being reserved' })
  table: Table;

  @ApiProperty({ description: 'The ID of the table being reserved' })
  tableId: number;

  @ApiProperty({
    description: 'The user who made the reservation',
    required: false,
  })
  user?: Users;

  @ApiProperty({
    description: 'The ID of the user who made the reservation',
    required: false,
  })
  userId?: number;

  @ApiProperty({
    description: 'The name of the customer making the reservation',
    example: 'John Doe',
  })
  customerName: string;

  @ApiProperty({
    description: 'The email of the customer making the reservation',
    example: 'john.doe@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    description: 'The phone number of the customer making the reservation',
    example: '+1234567890',
  })
  customerPhone: string;

  @ApiProperty({
    description: 'The number of people in the reservation',
    example: 4,
  })
  partySize: number;

  @ApiProperty({
    description: 'The date of the reservation',
    example: '2025-06-15',
  })
  reservationDate: Date;

  @ApiProperty({
    description: 'The time of the reservation',
    example: '19:00:00',
  })
  reservationTime: string;

  @ApiProperty({
    description: 'Any special requests for the reservation',
    example: 'Window seat preferred',
    required: false,
  })
  specialRequests?: string;

  @ApiProperty({
    description: 'The status of the reservation',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ApiProperty({ description: 'When the reservation was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the reservation was last updated' })
  updatedAt: Date;

  constructor(partial: Partial<TableReservation>) {
    Object.assign(this, partial);
  }
}
