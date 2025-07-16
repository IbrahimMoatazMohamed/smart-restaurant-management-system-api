import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { CouponWithRelationsResponseDto } from './dto/coupon-with-relations-response.dto';
import { CouponValidationResponseDto } from './dto/coupon-validation-response.dto';
import { isAfter } from 'date-fns';
import { CouponType } from './entities/coupon-type.enum';

/**
 * Coupons Service
 *
 * Handles coupon-related operations
 */
@Injectable()
export class CouponsService {
  /**
   * Constructor
   *
   * Initializes the coupons repository and custom logger
   */
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('CouponsService');
  }

  /**
   * Check if a coupon with the given code already exists
   *
   * @param code Coupon code to check
   * @param excludeId Optional coupon ID to exclude from the check (for updates)
   * @throws ConflictException if coupon with the code already exists
   */
  private async checkCouponCodeExists(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const existingCoupon = await this.couponsRepository.findOne({
      where: { code },
    });

    if (existingCoupon && (!excludeId || existingCoupon.id !== excludeId)) {
      throw new ConflictException(`Coupon with code '${code}' already exists`);
    }
  }

  /**
   * Validate coupon value based on type
   *
   * @param type Coupon type
   * @param value Coupon value
   * @throws BadRequestException if percentage coupon value exceeds 100
   */
  private validateCouponValue(type: CouponType, value: number): void {
    if (type === CouponType.PERCENTAGE && value > 100) {
      throw new BadRequestException(
        'Percentage coupon value cannot exceed 100',
      );
    }
  }

  /**
   * Create a new coupon
   *
   * @param createCouponDto Coupon creation data
   * @returns Created coupon
   */
  async create(createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    try {
      await this.checkCouponCodeExists(createCouponDto.code);

      this.validateCouponValue(createCouponDto.type, createCouponDto.value);

      const coupon = this.couponsRepository.create({
        ...createCouponDto,
        usageCount: 0,
      });

      const savedCoupon = await this.couponsRepository.save(coupon);
      return savedCoupon;
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, ConflictException],
        'Failed to create coupon',
        () => {
          this.logger.logError(err, 'CouponsService.create', {
            dto: createCouponDto,
          });
        },
      );
    }
  }

  /**
   * Find all coupons with optional filtering
   *
   * @param withDeleted Optional filter for deleted coupons
   * @param valid Optional filter for valid coupons (not expired and not exceeded usage limit)
   * @returns List of coupons
   */
  async findAll(
    withDeleted?: boolean,
    valid?: boolean,
  ): Promise<CouponResponseDto[]> {
    try {
      const now = new Date();
      let whereClause: Record<string, any> = {};

      if (valid) {
        whereClause = {
          ...whereClause,
          expiryDate: MoreThanOrEqual(now),
        };
      }

      // Convert withDeleted to boolean
      const includeDeleted = withDeleted === true;

      const coupons = await this.couponsRepository.find({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        withDeleted: includeDeleted,
      });

      const filteredCoupons = valid
        ? coupons.filter(
            (coupon) =>
              !coupon.usageLimit || coupon.usageCount < coupon.usageLimit,
          )
        : coupons;

      return filteredCoupons;
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve coupons', () => {
        this.logger.logError(err, 'CouponsService.findAll', {
          withDeleted: withDeleted,
          valid: valid,
        });
      });
    }
  }

  /**
   * Find a coupon by ID
   *
   * @param id Coupon ID
   * @param includeRelations Whether to include relations
   * @returns Coupon
   */
  async findOne(
    id: number,
    includeRelations = false,
  ): Promise<CouponResponseDto | CouponWithRelationsResponseDto> {
    try {
      const coupon = await this.couponsRepository.findOne({
        where: { id },
        relations: includeRelations ? ['orders'] : [],
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      return coupon;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to retrieve coupon with ID ${id}`,
        () => {
          this.logger.logError(err, 'CouponsService.findOne', { id });
        },
      );
    }
  }

  /**
   * Find a coupon by code
   *
   * @param code Coupon code
   * @returns Coupon
   */
  async findByCode(code: string): Promise<CouponResponseDto> {
    try {
      const coupon = await this.couponsRepository.findOne({
        where: { code },
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with code '${code}' not found`);
      }

      return coupon;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to retrieve coupon with code ${code}`,
        () => {
          this.logger.logError(err, 'CouponsService.findByCode', { code });
        },
      );
    }
  }

  /**
   * Validate if a coupon is applicable
   *
   * @param code Coupon code
   * @param orderAmount Order amount
   * @returns Coupon validation response
   */
  async validateCoupon(
    code: string,
    orderAmount: number,
  ): Promise<CouponValidationResponseDto> {
    try {
      const coupon = await this.couponsRepository.findOne({
        where: { code },
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with code '${code}' not found`);
      }

      const now = new Date();
      if (coupon.expiryDate && isAfter(new Date(), coupon.expiryDate)) {
        return {
          valid: false,
          message: `Coupon '${code}' has expired`,
        };
      }

      if (coupon.startDate && coupon.startDate > now) {
        throw new BadRequestException(`Coupon '${code}' is not yet active`);
      }
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return {
          valid: false,
          message: `Coupon '${code}' has reached its usage limit`,
        };
      }

      if (
        coupon.minimumOrderAmount &&
        orderAmount < coupon.minimumOrderAmount
      ) {
        return {
          valid: false,
          message: `Order amount does not meet the minimum requirement of $${coupon.minimumOrderAmount} for coupon '${code}'`,
        };
      }

      if (coupon.type === CouponType.PERCENTAGE && coupon.value > 100) {
        return {
          valid: false,
          message: `Coupon '${code}' has an invalid percentage value. Percentage cannot exceed 100%`,
        };
      }

      let discountAmount = 0;

      switch (coupon.type) {
        case CouponType.PERCENTAGE:
          discountAmount = (orderAmount * coupon.value) / 100;
          if (
            coupon.maximumDiscountAmount &&
            discountAmount > coupon.maximumDiscountAmount
          ) {
            discountAmount = coupon.maximumDiscountAmount;
          }
          break;
        case CouponType.FIXED:
          discountAmount = coupon.value;
          break;
        case CouponType.BOGO:
          discountAmount = 0;
          break;
        default:
          discountAmount = 0;
      }
      return {
        valid: true,
        coupon,
        discountAmount,
        message: `Coupon '${code}' applied successfully`,
      };
    } catch (err) {
      this.logger.logError(err, 'CouponsService.validateCoupon', {
        code,
        orderAmount,
      });

      return {
        valid: false,
        message:
          err instanceof Error ? err.message : 'Failed to validate coupon',
      };
    }
  }

  /**
   * Update a coupon
   *
   * @param id Coupon ID
   * @param updateCouponDto Coupon update data
   * @returns Updated coupon
   */
  async update(
    id: number,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    try {
      const oldCoupon = await this.findOne(id);

      if (updateCouponDto.expiryDate && !updateCouponDto.startDate) {
        if (!isAfter(oldCoupon.startDate, updateCouponDto.expiryDate)) {
          throw new BadRequestException('Expiry date must be in the future');
        }
      }

      if (updateCouponDto.startDate && !updateCouponDto.expiryDate) {
        if (!isAfter(updateCouponDto.startDate, oldCoupon.expiryDate)) {
          throw new BadRequestException(
            'Start date must be later than the current expiry date.',
          );
        }
      }

      if (updateCouponDto.code) {
        await this.checkCouponCodeExists(updateCouponDto.code, id);
      }

      const couponType = updateCouponDto.type || oldCoupon.type;
      const couponValue =
        updateCouponDto.value !== undefined
          ? updateCouponDto.value
          : oldCoupon.value;

      this.validateCouponValue(couponType, couponValue);

      const updatedCoupon = await this.couponsRepository.preload({
        id,
        ...updateCouponDto,
      });

      if (!updatedCoupon) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      const savedCoupon = await this.couponsRepository.save(updatedCoupon);
      return savedCoupon;
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, ConflictException, NotFoundException],
        `Failed to update coupon with ID ${id}`,
        () => {
          this.logger.logError(err, 'CouponsService.update', {
            id,
            dto: updateCouponDto,
          });
        },
      );
    }
  }

  /**
   * Increment coupon usage count
   *
   * @param id Coupon ID
   * @returns Updated coupon
   */
  async incrementUsage(id: number): Promise<CouponResponseDto> {
    try {
      const coupon = await this.couponsRepository.findOne({
        where: { id },
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      coupon.usageCount += 1;
      const savedCoupon = await this.couponsRepository.save(coupon);
      return savedCoupon;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to increment usage count for coupon with ID ${id}`,
        () => {
          this.logger.logError(err, 'CouponsService.incrementUsage', { id });
        },
      );
    }
  }

  /**
   * Remove a coupon
   *
   * @param id Coupon ID
   */
  async remove(id: number): Promise<void> {
    try {
      const couponWithRelations = await this.couponsRepository.findOne({
        where: { id },
        relations: ['orders'],
      });

      if (!couponWithRelations) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      if (couponWithRelations.orders && couponWithRelations.orders.length > 0) {
        throw new BadRequestException(
          `Cannot delete coupon with ID ${id} because it has associated orders`,
        );
      }

      const result = await this.couponsRepository.softDelete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }
    } catch (err) {
      handleError(
        err,
        [BadRequestException, NotFoundException],
        `Failed to delete coupon with ID ${id}`,
        () => {
          this.logger.logError(err, 'CouponsService.remove', { id });
        },
      );
    }
  }

  /**
   * Restore a coupon
   *
   * @param id Coupon ID
   */
  async restore(id: number): Promise<void> {
    try {
      const coupon = await this.couponsRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      if (!coupon.deletedAt) {
        throw new BadRequestException(`Coupon with ID ${id} is not deleted`);
      }

      await this.couponsRepository.restore(id);
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, NotFoundException],
        `Failed to restore coupon with ID ${id}`,
        () => {
          this.logger.logError(err, 'CouponsService.restore', { id });
        },
      );
    }
  }
}
