import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { TableStatus } from '../entities/table.entity';

@Exclude()
export class TableResponseDto {
  @Expose()
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the table' })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'The table table name',
    example: '101',
  })
  tableName: string;

  @Expose()
  @ApiProperty({
    description: 'The capacity of the table (number of seats)',
    example: 4,
  })
  capacity: number;

  @Expose()
  @ApiProperty({
    description: 'The status of the table',
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @Expose()
  @ApiProperty({ description: 'When the table was created' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'When the table was last updated' })
  updatedAt: Date;
}
