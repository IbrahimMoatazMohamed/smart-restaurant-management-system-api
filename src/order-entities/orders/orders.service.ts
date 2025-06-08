import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { MealsService } from '../../menu-entities/meals/meals.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Item } from '../../menu-entities/items/entities/item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderStatus } from './entities/order.entity';

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
    private readonly dataSource: DataSource,
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
   * Extract meal IDs from meal items array
   *
   * @param mealItems Array of meal items with quantities
   * @returns Array of meal IDs
   */
  private extractMealIds(
    mealItems?: { mealId: number; quantity: number }[],
  ): number[] {
    if (!mealItems || mealItems.length === 0) return [];
    return mealItems.map((item) => item.mealId);
  }

  /**
   * Create a new order
   *
   * @param createOrderDto Order creation data
   * @returns Created order
   */
  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.validateUserExists(createOrderDto.userId);

      const mealIds = this.extractMealIds(createOrderDto.mealItems);
      let meals: any[] = [];

      if (mealIds.length > 0) {
        meals = await this.validateMealsExist(mealIds);
      }

      const order = this.ordersRepository.create({
        status: OrderStatus.PENDING,
        totalAmount: createOrderDto.totalAmount,
        specialInstructions: createOrderDto.specialInstructions,
        userId: createOrderDto.userId,
        user,
        meals,
      });

      const savedOrder = await this.ordersRepository.save(order);

      if (createOrderDto.mealItems && createOrderDto.mealItems.length > 0) {
        for (const mealItem of createOrderDto.mealItems) {
          await queryRunner.query(
            `UPDATE order_meals SET quantity = ? WHERE order_id = ? AND meal_id = ?`,
            [mealItem.quantity, savedOrder.id, mealItem.mealId],
          );
        }
      }

      if (createOrderDto.menuItems && createOrderDto.menuItems.length > 0) {
        const itemRepository = queryRunner.manager.getRepository(Item);
        const itemIds = createOrderDto.menuItems.map((item) => item.itemId);
        const items = await itemRepository.findByIds(itemIds);

        savedOrder.items = items;
        await queryRunner.manager.save(savedOrder);

        for (const menuItem of createOrderDto.menuItems) {
          await queryRunner.query(
            `UPDATE order_items SET quantity = ? WHERE order_id = ? AND item_id = ?`,
            [menuItem.quantity, savedOrder.id, menuItem.itemId],
          );
        }
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
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
    } finally {
      await queryRunner.release();
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.findOne(id);

      if (updateOrderDto.userId) {
        const user = await this.validateUserExists(updateOrderDto.userId);
        order.user = user;
        order.userId = updateOrderDto.userId;
      }

      if (updateOrderDto.mealItems && updateOrderDto.mealItems.length > 0) {
        const mealIds = this.extractMealIds(updateOrderDto.mealItems);
        if (mealIds.length > 0) {
          const meals = await this.validateMealsExist(mealIds);
          order.meals = meals;

          await queryRunner.manager.save(order);

          for (const mealItem of updateOrderDto.mealItems) {
            await queryRunner.query(
              `UPDATE order_meals SET quantity = ? WHERE order_id = ? AND meal_id = ?`,
              [mealItem.quantity, order.id, mealItem.mealId],
            );
          }
        }
      }

      if (updateOrderDto.menuItems && updateOrderDto.menuItems.length > 0) {
        const itemRepository = queryRunner.manager.getRepository(Item);
        const itemIds = updateOrderDto.menuItems.map((item) => item.itemId);
        const items = await itemRepository.findByIds(itemIds);

        order.items = items;
        await queryRunner.manager.save(order);

        for (const menuItem of updateOrderDto.menuItems) {
          await queryRunner.query(
            `UPDATE order_items SET quantity = ? WHERE order_id = ? AND item_id = ?`,
            [menuItem.quantity, order.id, menuItem.itemId],
          );
        }
      }

      if (updateOrderDto.status) {
        order.status = updateOrderDto.status;
      }

      if (updateOrderDto.totalAmount) {
        order.totalAmount = updateOrderDto.totalAmount;
      }

      if (updateOrderDto.specialInstructions) {
        order.specialInstructions = updateOrderDto.specialInstructions;
      }

      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      return this.findOne(id);
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
