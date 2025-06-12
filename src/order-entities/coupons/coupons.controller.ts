import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { CouponWithRelationsResponseDto } from './dto/coupon-with-relations-response.dto';
import { isBefore } from 'date-fns';
import { CouponValidationResponseDto } from './dto/coupon-validation-response.dto';

/**
 * Coupons Controller
 *
 * Handles HTTP requests related to coupons
 */
@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  /**
   * Constructor
   *
   * Initializes the coupons service and custom logger
   */
  constructor(
    private readonly couponsService: CouponsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('CouponsController');
  }

  /**
   * Create a new coupon
   *
   * @param createCouponDto Coupon creation data
   * @returns Created coupon
   */
  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiBody({ type: CreateCouponDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The coupon has been successfully created',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid coupon data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Coupon with the same code already exists',
  })
  async create(
    @Body() createCouponDto: CreateCouponDto,
  ): Promise<CouponResponseDto> {
    this.logger.log(`Creating new coupon with code: ${createCouponDto.code}`);

    // Validate that start date is before expiry date
    if (createCouponDto.startDate && createCouponDto.expiryDate) {
      if (!isBefore(createCouponDto.startDate, createCouponDto.expiryDate)) {
        throw new BadRequestException('Start date must be before expiry date');
      }
    }

    return await this.couponsService.create(createCouponDto);
  }

  /**
   * Get all coupons with optional filtering
   *
   * @param active Optional filter for active coupons
   * @param valid Optional filter for valid coupons (not expired and not exceeded usage limit)
   * @returns List of coupons
   */
  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'valid',
    required: false,
    type: Boolean,
    description:
      'Filter by validity (not expired and not exceeded usage limit)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of coupons',
    type: [CouponResponseDto],
  })
  async findAll(
    @Query('active') active?: boolean,
    @Query('valid') valid?: boolean,
  ): Promise<CouponResponseDto[]> {
    this.logger.log(
      `Retrieving all coupons with filters: active=${active}, valid=${valid}`,
    );
    return await this.couponsService.findAll(active, valid);
  }

  /**
   * Get a coupon by ID
   *
   * @param id Coupon ID
   * @param includeRelations Whether to include relations
   * @returns Coupon
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a coupon by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Coupon ID',
    type: Number,
  })
  @ApiQuery({
    name: 'includeRelations',
    required: false,
    type: Boolean,
    description: 'Include relations like orders',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon found',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations', new ParseBoolPipe({ optional: true }))
    includeRelations = false,
  ): Promise<CouponResponseDto | CouponWithRelationsResponseDto> {
    this.logger.log(
      `Retrieving coupon with ID: ${id}, relations=${includeRelations}`,
    );
    return await this.couponsService.findOne(id, includeRelations);
  }

  /**
   * Update a coupon
   *
   * @param id Coupon ID
   * @param updateCouponDto Coupon update data
   * @returns Updated coupon
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Coupon ID',
    type: Number,
  })
  @ApiBody({ type: UpdateCouponDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The coupon has been successfully updated',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid coupon data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Coupon with the same code already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    this.logger.log(`Updating coupon with ID: ${id}`);

    // Validate that start date is before expiry date if both are provided
    if (updateCouponDto.startDate && updateCouponDto.expiryDate) {
      const startDate = new Date(updateCouponDto.startDate);
      const expiryDate = new Date(updateCouponDto.expiryDate);

      if (!isBefore(startDate, expiryDate)) {
        throw new BadRequestException('Start date must be before expiry date');
      }
    }

    return await this.couponsService.update(id, updateCouponDto);
  }

  /**
   * Validate a coupon
   *
   * @param code Coupon code
   * @param orderAmount Order amount
   * @returns Validated coupon
   */
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a coupon' })
  @ApiParam({
    name: 'code',
    required: true,
    description: 'Coupon code',
    type: String,
  })
  @ApiQuery({
    name: 'orderAmount',
    required: true,
    type: Number,
    description: 'Order amount',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coupon is valid',
    type: CouponValidationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Coupon is invalid',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  async validateCoupon(
    @Param('code') code: string,
    @Query('orderAmount') orderAmount: string,
  ): Promise<CouponValidationResponseDto> {
    // Parse orderAmount as float to handle decimal values
    const parsedAmount = parseFloat(orderAmount);
    if (isNaN(parsedAmount)) {
      throw new BadRequestException('Order amount must be a valid number');
    }
    this.logger.log(
      `Validating coupon with code: ${code} for amount: ${parsedAmount}`,
    );
    return await this.couponsService.validateCoupon(code, parsedAmount);
  }

  /**
   * Delete a coupon
   *
   * @param id Coupon ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Coupon ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The coupon has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete coupon with associated orders',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Coupon not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Deleting coupon with ID: ${id}`);
    await this.couponsService.remove(id);
  }
}
