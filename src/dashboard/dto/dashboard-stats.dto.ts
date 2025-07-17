import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Label for the statistic',
    example: 'Active Orders',
  })
  label: string;

  @ApiProperty({
    description: 'Value of the statistic',
    example: 5,
  })
  value: number;

  @ApiProperty({
    description: 'CSS color class for styling',
    example: 'bg-blue-100 text-blue-800',
  })
  color: string;
}
