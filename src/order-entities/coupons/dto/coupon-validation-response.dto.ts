import { ApiProperty } from '@nestjs/swagger';
import { Coupon } from '../entities/coupon.entity';

/**
 * Coupon Validation Response DTO
 * Used for returning the result of coupon validation
 */
export class CouponValidationResponseDto {
  @ApiProperty({
    description: 'Whether the coupon is valid for the current order',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'The coupon object if valid',
    example: null,
    required: false,
  })
  coupon?: Coupon;

  @ApiProperty({
    description: 'Validation message',
    example: 'Coupon applied successfully',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Calculated discount amount',
    example: 10.5,
    required: false,
  })
  discountAmount?: number;
}
