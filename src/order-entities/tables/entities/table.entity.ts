import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../orders/entities/order.entity';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the table' })
  id: number;

  @Column()
  @ApiProperty({
    description: 'The table table name',
    example: '101',
  })
  tableName: string;

  @Column({ type: 'int' })
  @ApiProperty({
    description: 'The capacity of the table (number of seats)',
    example: 4,
  })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
  @ApiProperty({
    description: 'The status of the table',
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @OneToMany(() => Order, (order) => order.table)
  @ApiProperty({
    description: 'The orders associated with this table',
    type: [Order],
  })
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'When the table was created' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'When the table was last updated' })
  updatedAt: Date;
}
