import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { UsersService } from '../../users/users.service';
import { MealsService } from '../../menu-entities/meals/meals.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from 'src/utils/entity-validation.util';

/**
 * Orders Service
 *
 * Handles order-related operations
 */
@Injectable()
export class OrdersService {
  /**
   * Constructor
   *
   * Initializes the orders repository, users service, meals service, and custom logger
   */
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly usersService: UsersService,
    private readonly mealsService: MealsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('OrdersService');
  }

  /**
   * Validate that a user exists
   *
   * @param userId User ID to validate
   * @throws BadRequestException if user doesn't exist
   */
  private async validateUserExists(userId: number) {
    return await validateEntityExists(userId, this.usersService, 'User');
  }

  /**
   * Validate that all meals exist
   *
   * @param mealIds Array of meal IDs to validate
   * @throws BadRequestException if any meal doesn't exist
   */
  private async validateMealsExist(mealIds: number[]) {
    return await Promise.all(
      mealIds.map(async (id) => {
        return await validateEntityExists(id, this.mealsService, 'Meal');
      }),
    );
  }

  /**
   * Create a new order
   *
   * @param createOrderDto Order creation data
   * @returns Created order
   */
  async create(createOrderDto: CreateOrderDto) {
    try {
      // Validate user exists
      const user = await this.validateUserExists(createOrderDto.userId);

      // Validate meals exist
      const meals = await this.validateMealsExist(createOrderDto.mealIds);

      // Create and save the order
      const order = this.ordersRepository.create({
        status: createOrderDto.status,
        totalAmount: createOrderDto.totalAmount,
        specialInstructions: createOrderDto.specialInstructions,
        userId: createOrderDto.userId,
        user,
        meals,
      });

      return await this.ordersRepository.save(order);
    } catch (err) {
      return handleError(
        err,
        [ConflictException, BadRequestException],
        'Failed to create order',
        () => {
          this.logger.logError(err, 'OrdersService.create', {
            dto: createOrderDto,
          });
        },
      );
    }
  }

  /**
   * Find all orders
   *
   * @returns List of all orders
   */
  async findAll() {
    try {
      return await this.ordersRepository.find();
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve orders', () => {
        this.logger.logError(err, 'OrdersService.findAll');
      });
    }
  }

  /**
   * Find an order by ID
   *
   * @param id Order ID
   * @returns Order with user and meal relations
   */
  async findOne(id: number) {
    try {
      const order = await this.ordersRepository.findOne({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      return order;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to retrieve order with ID ${id}`,
        () => {
          this.logger.logError(err, 'OrdersService.findOne', { id });
        },
      );
    }
  }

  /**
   * Update an existing order
   *
   * @param id Order ID
   * @param updateOrderDto Order update data
   * @returns Updated order
   */
  async update(id: number, updateOrderDto: UpdateOrderDto) {
    try {
      // Check if the order exists
      const order = await this.findOne(id);

      // Check if user is being updated and if it exists
      if (updateOrderDto.userId) {
        const user = await this.validateUserExists(updateOrderDto.userId);
        order.user = user;
        order.userId = updateOrderDto.userId;
      }

      // Update meals if provided
      if (updateOrderDto.mealIds && updateOrderDto.mealIds.length > 0) {
        const meals = await this.validateMealsExist(updateOrderDto.mealIds);
        order.meals = meals;
      }

      // Update other properties using a dynamic approach
      const allowedFields = ['status', 'totalAmount', 'specialInstructions'];
      const updatedFields = Object.fromEntries(
        Object.entries(updateOrderDto).filter(
          ([key, value]) => allowedFields.includes(key) && value !== undefined,
        ),
      );

      // Apply updates
      Object.assign(order, updatedFields);

      return await this.ordersRepository.save(order);
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, NotFoundException],
        `Failed to update order with ID ${id}`,
        () => {
          this.logger.logError(err, 'OrdersService.update', {
            id,
            dto: updateOrderDto,
          });
        },
      );
    }
  }

  /**
   * Remove an order by ID
   *
   * @param id Order ID
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if order exists
      await this.findOne(id);

      await this.ordersRepository.delete(id);
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to delete order with ID ${id}`,
        () => {
          this.logger.logError(err, 'OrdersService.remove', { id });
        },
      );
    }
  }
}
