import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ReservationStatus } from '../entities/table-reservation.entity';

export class CreateTableReservationDto {
  @ApiProperty({
    description: 'The ID of the table to reserve',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  tableId: number;

  @ApiProperty({
    description:
      'The ID of the user making the reservation (optional for guest reservations)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    description: 'The name of the customer making the reservation',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    description: 'The email of the customer making the reservation',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({
    description: 'The phone number of the customer making the reservation',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({
    description: 'The number of people in the reservation',
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsNotEmpty()
  partySize: number;

  @ApiProperty({
    description: 'The date of the reservation',
    example: '2025-06-15',
  })
  @IsDateString()
  @IsNotEmpty()
  reservationDate: string;

  @ApiProperty({
    description: 'The time of the reservation',
    example: '19:00:00',
  })
  @IsString()
  @IsNotEmpty()
  reservationTime: string;

  @ApiProperty({
    description: 'Any special requests for the reservation',
    example: 'Window seat preferred',
    required: false,
  })
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @ApiProperty({
    description: 'The status of the reservation',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
    default: ReservationStatus.PENDING,
    required: false,
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;
}
