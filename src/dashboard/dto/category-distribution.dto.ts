import { ApiProperty } from '@nestjs/swagger';

export class CategoryDistributionDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Main Course',
  })
  name: string;

  @ApiProperty({
    description: 'Number of meals in this category',
    example: 8,
  })
  value: number;
}
