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
import { isAfter } from 'date-fns';

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
   * Create a new coupon
   *
   * @param createCouponDto Coupon creation data
   * @returns Created coupon
   */
  async create(createCouponDto: CreateCouponDto): Promise<CouponResponseDto> {
    try {
      // Check if coupon code already exists
      await this.checkCouponCodeExists(createCouponDto.code);

      // Create and save the coupon
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
   * @param active Optional filter for active coupons
   * @param valid Optional filter for valid coupons (not expired and not exceeded usage limit)
   * @returns List of coupons
   */
  async findAll(
    active?: boolean,
    valid?: boolean,
  ): Promise<CouponResponseDto[]> {
    try {
      const now = new Date();
      let whereClause: Record<string, any> = {};

      // Filter by active status if specified
      if (active !== undefined) {
        whereClause.isActive = active;
      }

      // Filter by validity if specified
      if (valid) {
        whereClause = {
          ...whereClause,
          // Not expired or no expiry date
          expiryDate: MoreThanOrEqual(now),
        };
      }

      const coupons = await this.couponsRepository.find({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      });

      // Additional filtering for usage limit
      const filteredCoupons = valid
        ? coupons.filter(
            (coupon) =>
              !coupon.usageLimit || coupon.usageCount < coupon.usageLimit,
          )
        : coupons;

      return filteredCoupons;
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve coupons', () => {
        this.logger.logError(err, 'CouponsService.findAll');
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
   * @returns Validated coupon
   */
  async validateCoupon(
    code: string,
    orderAmount: number,
  ): Promise<CouponResponseDto> {
    try {
      const coupon = await this.couponsRepository.findOne({
        where: { code },
      });

      if (!coupon) {
        throw new NotFoundException(`Coupon with code '${code}' not found`);
      }

      // Check if coupon is active
      if (!coupon.isActive) {
        throw new BadRequestException(`Coupon '${code}' is inactive`);
      }

      // Check if coupon has expired
      const now = new Date();
      if (coupon.expiryDate && coupon.expiryDate < now) {
        throw new BadRequestException(`Coupon '${code}' has expired`);
      }

      // Check if coupon has started
      if (coupon.startDate && coupon.startDate > now) {
        throw new BadRequestException(`Coupon '${code}' is not yet active`);
      }

      // Check if usage limit is reached
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new BadRequestException(
          `Coupon '${code}' has reached its usage limit`,
        );
      }

      // Check minimum order amount
      if (
        coupon.minimumOrderAmount &&
        orderAmount < coupon.minimumOrderAmount
      ) {
        throw new BadRequestException(
          `Order amount does not meet the minimum requirement of ${coupon.minimumOrderAmount} for coupon '${code}'`,
        );
      }

      return coupon;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException, BadRequestException],
        `Failed to validate coupon with code ${code}`,
        () => {
          this.logger.logError(err, 'CouponsService.validateCoupon', {
            code,
            orderAmount,
          });
        },
      );
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
      // Check if the coupon exists
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

      // Check if coupon code is being updated and if it already exists
      if (updateCouponDto.code) {
        await this.checkCouponCodeExists(updateCouponDto.code, id);
      }

      // Update the coupon
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
      // Get coupon with relations to check if it has associated orders
      const couponWithRelations = await this.couponsRepository.findOne({
        where: { id },
        relations: ['orders'],
      });

      if (!couponWithRelations) {
        throw new NotFoundException(`Coupon with ID ${id} not found`);
      }

      // Check if coupon has associated orders
      if (couponWithRelations.orders && couponWithRelations.orders.length > 0) {
        throw new BadRequestException(
          `Cannot delete coupon with ID ${id} because it has associated orders`,
        );
      }

      const result = await this.couponsRepository.delete(id);

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
}
