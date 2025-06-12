import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Table } from '../../tables/entities/table.entity';
import { Users } from '../../../users/entities/users.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('table_reservations')
export class TableReservation {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the reservation' })
  id: number;

  @ManyToOne(() => Table, { eager: true })
  @JoinColumn({ name: 'table_id' })
  @ApiProperty({ description: 'The table being reserved' })
  table: Table;

  @Column({ name: 'table_id' })
  @ApiProperty({ description: 'The ID of the table being reserved' })
  tableId: number;

  @ManyToOne(() => Users, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({
    description:
      'The user who made the reservation (optional for guest reservations)',
  })
  user: Users;

  @Column({ name: 'user_id', nullable: true })
  @ApiProperty({
    description:
      'The ID of the user who made the reservation (optional for guest reservations)',
  })
  userId: number | null;

  @Column({ name: 'customer_name' })
  @ApiProperty({
    description: 'The name of the customer making the reservation',
    example: 'John Doe',
  })
  customerName: string;

  @Column({ name: 'customer_email' })
  @ApiProperty({
    description: 'The email of the customer making the reservation',
    example: 'john.doe@example.com',
  })
  customerEmail: string;

  @Column({ name: 'customer_phone' })
  @ApiProperty({
    description: 'The phone number of the customer making the reservation',
    example: '+1234567890',
  })
  customerPhone: string;

  @Column({ name: 'party_size' })
  @ApiProperty({
    description: 'The number of people in the reservation',
    example: 4,
  })
  partySize: number;

  @Column({ name: 'reservation_date', type: 'date' })
  @ApiProperty({
    description: 'The date of the reservation',
    example: '2025-06-15',
  })
  reservationDate: Date;

  @Column({ name: 'reservation_time', type: 'time' })
  @ApiProperty({
    description: 'The time of the reservation',
    example: '19:00:00',
  })
  reservationTime: string;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Any special requests for the reservation',
    example: 'Window seat preferred',
    required: false,
  })
  specialRequests?: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  @ApiProperty({
    description: 'The status of the reservation',
    enum: ReservationStatus,
    example: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the reservation was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the reservation was last updated' })
  updatedAt: Date;
}
