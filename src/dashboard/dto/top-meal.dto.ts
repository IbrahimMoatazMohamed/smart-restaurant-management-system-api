import { ApiProperty } from '@nestjs/swagger';

export class TopMealDto {
  @ApiProperty({
    description: 'Unique identifier of the meal',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the meal',
    example: 'Grilled Salmon',
  })
  name: string;

  @ApiProperty({
    description: 'Price of the meal',
    example: 24.99,
  })
  price: number;

  @ApiProperty({
    description: 'Description of the meal',
    example: 'Fresh salmon fillet grilled to perfection with herbs and lemon',
  })
  description: string;

  @ApiProperty({
    description: 'URL to the meal image',
    example: 'https://example.com/images/grilled-salmon.jpg',
    required: false,
  })
  image?: string;
}
