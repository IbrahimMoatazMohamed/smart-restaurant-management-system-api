import { ApiProperty } from '@nestjs/swagger';

export class HourlyRevenueDto {
  @ApiProperty({
    description: 'Hour of the day in format H:00',
    example: '14:00',
  })
  name: string;

  @ApiProperty({
    description: 'Revenue amount for this hour',
    example: 245.5,
  })
  value: number;
}
