import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TableStatus } from '../entities/table.entity';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The table table name',
    example: '101',
  })
  tableName: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The capacity of the table (number of seats)',
    example: 4,
  })
  capacity: number;

  @IsEnum(TableStatus)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The status of the table',
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  status: TableStatus;
}
