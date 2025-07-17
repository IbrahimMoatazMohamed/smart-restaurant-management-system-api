import { ApiProperty } from '@nestjs/swagger';

export class TableStatusDto {
  @ApiProperty({
    description: 'Table status name',
    example: 'OCCUPIED',
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
  })
  name: string;

  @ApiProperty({
    description: 'Count of tables with this status',
    example: 5,
  })
  value: number;
}
