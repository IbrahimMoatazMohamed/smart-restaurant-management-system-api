import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import Gender from '../types/gender';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'The name of the user' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'The email of the user' })
  email: string;

  @Expose()
  @ApiProperty({ description: 'The country of the user' })
  country: string;

  @Expose()
  @ApiProperty({ description: 'The role of the user' })
  role: string;

  @Expose()
  @ApiProperty({ description: 'The phone number of the user' })
  phone: string;

  @Expose()
  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
  })
  gender: string;

  @Expose()
  @ApiProperty({ description: 'The creation date of the user record' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'The last update date of the user record' })
  updatedAt: Date;
}
