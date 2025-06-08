import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { MealsService } from '../../menu-entities/meals/meals.service';
import { ItemsService } from '../../menu-entities/items/items.service';
import { CouponsService } from '../../order-entities/coupons/coupons.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import {
  OrderMealItem,
  OrderItemType,
} from './entities/order-meal-item.entity';

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
   * Initializes the orders repository, users service, meals service, items service, coupons service, and custom logger
   */
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderMealItem)
    private readonly orderMealItemRepository: Repository<OrderMealItem>,
    private readonly usersService: UsersService,
    private readonly mealsService: MealsService,
    private readonly itemsService: ItemsService,
    private readonly couponsService: CouponsService,
    private readonly dataSource: DataSource,
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
    if (!mealIds || mealIds.length === 0) return [];

    return await Promise.all(
      mealIds.map(async (id) => {
        return await validateEntityExists(id, this.mealsService, 'Meal');
      }),
    );
  }

  /**
   * Validate that all items exist
   *
   * @param itemIds Array of item IDs to validate
   * @throws BadRequestException if any item doesn't exist
   */
  private async validateItemsExist(itemIds: number[]) {
    if (!itemIds || itemIds.length === 0) return [];

    return await Promise.all(
      itemIds.map(async (id) => {
        return await validateEntityExists(id, this.itemsService, 'Item');
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
   * Extract item IDs from menu items array
   *
   * @param menuItems Array of menu items with quantities
   * @returns Array of item IDs
   */
  private extractItemIds(
    menuItems?: { itemId: number; quantity: number }[],
  ): number[] {
    if (!menuItems || menuItems.length === 0) return [];
    return menuItems.map((item) => item.itemId);
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
      await this.validateUserExists(createOrderDto.userId);

      let couponId: number | undefined = undefined;
      if (createOrderDto.couponCode) {
        try {
          const validCoupon = await this.couponsService.validateCoupon(
            createOrderDto.couponCode,
            createOrderDto.totalAmount,
          );
          couponId = validCoupon.id;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          throw new BadRequestException(`Invalid coupon: ${errorMessage}`);
        }
      }

      const mealIds = this.extractMealIds(createOrderDto.mealItems);
      if (mealIds.length > 0) {
        await this.validateMealsExist(mealIds);
      }

      const itemIds = this.extractItemIds(createOrderDto.menuItems);
      if (itemIds.length > 0) {
        await this.validateItemsExist(itemIds);
      }

      const order = this.ordersRepository.create({
        userId: createOrderDto.userId,
        tableId: createOrderDto.tableId,
        status: OrderStatus.PENDING,
        totalAmount: createOrderDto.totalAmount,
        specialInstructions: createOrderDto.specialInstructions,
        couponId: couponId,
      });

      const savedOrder = await queryRunner.manager.save(order);

      if (createOrderDto.mealItems && createOrderDto.mealItems.length > 0) {
        for (const mealItem of createOrderDto.mealItems) {
          const orderMealItem = this.orderMealItemRepository.create({
            orderId: savedOrder.id,
            mealId: mealItem.mealId,
            type: OrderItemType.MEAL,
            quantity: mealItem.quantity,
          });
          await queryRunner.manager.save(orderMealItem);
        }
      }

      if (createOrderDto.menuItems && createOrderDto.menuItems.length > 0) {
        for (const menuItem of createOrderDto.menuItems) {
          const orderMealItem = this.orderMealItemRepository.create({
            orderId: savedOrder.id,
            itemId: menuItem.itemId,
            type: OrderItemType.ITEM,
            quantity: menuItem.quantity,
          });
          await queryRunner.manager.save(orderMealItem);
        }
      }

      await queryRunner.commitTransaction();

      if (couponId) {
        await this.couponsService.incrementUsage(couponId);
      }

      return this.findOne(savedOrder.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        'Failed to create order',
        () => {
          this.logger.logError(error, 'OrdersService.create', {
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
        relations: [
          'user',
          'table',
          'coupon',
          'orderMealItems',
          'orderMealItems.meal',
          'orderMealItems.item',
        ],
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
          await this.validateMealsExist(mealIds);
          await this.orderMealItemRepository.delete({
            orderId: order.id,
            type: OrderItemType.MEAL,
          });

          for (const mealItem of updateOrderDto.mealItems) {
            const orderMealItem = this.orderMealItemRepository.create({
              orderId: order.id,
              mealId: mealItem.mealId,
              type: OrderItemType.MEAL,
              quantity: mealItem.quantity,
            });
            await queryRunner.manager.save(orderMealItem);
          }
        }
      }

      if (updateOrderDto.menuItems && updateOrderDto.menuItems.length > 0) {
        const itemIds = this.extractItemIds(updateOrderDto.menuItems);
        if (itemIds.length > 0) {
          await this.validateItemsExist(itemIds);

          await this.orderMealItemRepository.delete({
            orderId: order.id,
            type: OrderItemType.ITEM,
          });

          for (const menuItem of updateOrderDto.menuItems) {
            const orderMealItem = this.orderMealItemRepository.create({
              orderId: order.id,
              itemId: menuItem.itemId,
              type: OrderItemType.ITEM,
              quantity: menuItem.quantity,
            });
            await queryRunner.manager.save(orderMealItem);
          }
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.findOne(id);

      await this.orderMealItemRepository.delete({ orderId: id });

      await this.ordersRepository.delete(id);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return handleError(
        err,
        [NotFoundException],
        `Failed to delete order with ID ${id}`,
        () => {
          this.logger.logError(err, 'OrdersService.remove', { id });
        },
      );
    } finally {
      await queryRunner.release();
    }
  }
}
