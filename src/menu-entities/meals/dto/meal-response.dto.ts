import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { MealStatus } from '../entities/meal.entity';

@Exclude()
export class MealResponseDto {
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the meal' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'The name of the meal' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'The description of the meal' })
  description: string;

  @Expose()
  @ApiProperty({ description: 'The price of the meal' })
  price: number;

  @Expose()
  @ApiProperty({ description: 'The photo of the meal' })
  photo: string;

  @Expose()
  @ApiProperty({
    description: 'The status of the meal',
    enum: MealStatus,
    example: MealStatus.AVAILABLE,
  })
  status: MealStatus;

  @Expose()
  @ApiProperty({
    description: 'The ID of the category this meal belongs to',
    required: false,
  })
  categoryId: number;

  @Expose()
  @ApiProperty({ description: 'When the meal was created' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'When the meal was last updated' })
  updatedAt: Date;
}
