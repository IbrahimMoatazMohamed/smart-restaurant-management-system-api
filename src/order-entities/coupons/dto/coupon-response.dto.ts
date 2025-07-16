import { ApiProperty } from '@nestjs/swagger';
import { CouponType } from '../entities/coupon-type.enum';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CouponResponseDto {
  @Expose()
  @ApiProperty({ description: 'Unique identifier for the coupon' })
  id: number;

  @Expose()
  @ApiProperty({ description: 'Unique coupon code' })
  code: string;

  @Expose()
  @ApiProperty({ description: 'Description of the coupon' })
  description: string;

  @Expose()
  @ApiProperty({ description: 'Type of coupon', enum: CouponType })
  type: CouponType;

  @Expose()
  @ApiProperty({
    description: 'Value of the coupon (percentage or fixed amount)',
  })
  value: number;

  @Expose()
  @ApiProperty({
    description: 'Minimum order amount required to use the coupon',
  })
  minimumOrderAmount: number;

  @Expose()
  @ApiProperty({ description: 'Maximum discount amount that can be applied' })
  maximumDiscountAmount: number;

  @Expose()
  @ApiProperty({ description: 'Start date of coupon validity' })
  startDate: Date;

  @Expose()
  @ApiProperty({ description: 'Expiry date of coupon' })
  expiryDate: Date;

  @Expose()
  @ApiProperty({ description: 'Maximum usage limit of the coupon' })
  usageLimit: number;

  @Expose()
  @ApiProperty({ description: 'Current usage count of the coupon' })
  usageCount: number;

  @Expose()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
