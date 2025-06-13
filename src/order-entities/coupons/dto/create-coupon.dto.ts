import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
  IsBoolean,
  IsPositive,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../entities/coupon-type.enum';

export class CreateCouponDto {
  @ApiProperty({
    description: 'Unique code for the coupon',
    example: 'SUMMER2023',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Description of the coupon',
    example: 'Summer discount for all menu items',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of coupon',
    example: CouponType.PERCENTAGE,
    enum: CouponType,
  })
  @IsString()
  @IsNotEmpty()
  type: CouponType;

  @ApiProperty({
    description: 'Value of the coupon (percentage or fixed amount)',
    example: 15,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  value: number;

  @ApiProperty({
    description: 'Minimum order amount required to use the coupon',
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumOrderAmount?: number;

  @ApiProperty({
    description: 'Maximum discount amount',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maximumDiscountAmount?: number;

  @ApiProperty({
    description: 'Start date of the coupon validity',
    example: '2023-01-01T00:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    description: 'Expiry date of the coupon',
    example: '2023-12-31T23:59:59Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({
    description: 'Maximum number of times the coupon can be used',
    example: 100,
    required: false,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({
    description: 'Whether the coupon is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
