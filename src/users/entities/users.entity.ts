import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import Gender from '../types/gender';
import { Order } from '../../order-entities/orders/entities/order.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: number;

  @Column()
  @ApiProperty({ description: 'The name of the user' })
  name: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'The email of the user' })
  email: string;

  @Column()
  @ApiProperty({ description: 'The country of the user' })
  country: string;

  // @Column('decimal', { precision: 10, scale: 2 })
  // @ApiProperty({ description: 'The salary of the user' })
  // salary: number;

  @Column({ default: 'user' })
  @ApiProperty({ description: 'The role of the user' })
  role: string;

  @Column({ select: false })
  password: string;

  @Column()
  @ApiProperty({ description: 'The phone number of the user' })
  phone: string;

  @Column({ type: 'enum', enum: Gender })
  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
  })
  gender: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'The profile image URL of the user',
    required: false,
  })
  imageUrl: string;

  @OneToMany(() => Order, (order) => order.user)
  @ApiProperty({
    description: 'The orders placed by this user',
    type: () => [Order],
  })
  orders: Order[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'The creation date of the user record' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'The last update date of the user record' })
  updatedAt: Date;
}
