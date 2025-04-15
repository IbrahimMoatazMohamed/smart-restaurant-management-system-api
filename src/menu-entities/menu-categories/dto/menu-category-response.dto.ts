import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MenuCategoryResponseDto {
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the menu category' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'The name of the menu category' })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'The description of the menu category',
    required: false,
  })
  description: string;

  @Expose()
  @ApiProperty({
    description: 'Whether the menu category is active',
    example: true,
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({ description: 'When the menu category was created' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'When the menu category was last updated' })
  updatedAt: Date;
}
