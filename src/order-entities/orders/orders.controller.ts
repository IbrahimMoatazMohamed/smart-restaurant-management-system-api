import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { MeOrAdmin } from '../../auth/decorators/me-or-admin.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  AdminOnly,
  RequirePermissions,
} from '../../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * Orders Controller
 *
 * Handles order-related operations
 */
@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  /**
   * Constructor
   *
   * Initializes the orders service and custom logger
   */
  constructor(
    private readonly ordersService: OrdersService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('OrdersController');
  }

  /**
   * Create a new order
   *
   * @param createOrderDto Order creation data
   * @returns Created order
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order has been successfully created.',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, user not found, or meals not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create order.',
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Creating new order for user ID: ${createOrderDto.userId}`);

    return await this.ordersService.create(createOrderDto);
  }

  /**
   * Get all orders
   *
   * @returns List of all orders
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('orders.read')
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all orders.',
    type: [OrderResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve orders.',
  })
  async findAll(): Promise<OrderResponseDto[]> {
    this.logger.log('Retrieving all orders');

    return await this.ordersService.findAll();
  }

  /**
   * Get orders by user ID
   *
   * @param userId User ID
   * @returns List of orders for the specified user
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get orders by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of orders for the specified user.',
    type: [OrderResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'User not found or no orders found for this user.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve orders.',
  })
  async findByUserId(@MeOrAdmin() userId: string): Promise<OrderResponseDto[]> {
    this.logger.log(`Retrieving orders for user with ID: ${userId}`);

    try {
      return await this.ordersService.findByUserId(+userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error retrieving orders for user: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get an order by ID
   *
   * @param id Order ID
   * @returns Order
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('orders.read')
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order found.',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve order.',
  })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    this.logger.log(`Retrieving order with ID: ${id}`);

    return await this.ordersService.findOne(+id);
  }

  /**
   * Update an order
   *
   * @param id Order ID
   * @param updateOrderDto Order update data
   * @returns Updated order
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('orders.update')
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order has been successfully updated.',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Order not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data, user not found, or meals not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update order.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    this.logger.log(`Updating order with ID: ${id}`);

    return await this.ordersService.update(+id, updateOrderDto);
  }

  /**
   * Delete an order
   *
   * @param id Order ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('orders.delete')
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Order has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Order not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete order.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting order with ID: ${id}`);

    await this.ordersService.remove(+id);
  }
}
