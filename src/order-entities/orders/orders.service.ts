import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { MealsService } from '../../menu-entities/meals/meals.service';
import { ItemsService } from '../../menu-entities/items/items.service';
import { CouponsService } from '../../order-entities/coupons/coupons.service';
import { TablesService } from '../../order-entities/tables/tables.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';
import { Repository } from 'typeorm';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';
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
@Injectable({ scope: Scope.REQUEST })
export class OrdersService {
  private readonly orderRepoPromise: Promise<Repository<Order>>;
  private readonly orderMealItemRepoPromise: Promise<Repository<OrderMealItem>>;

  /**
   * Constructor
   *
   * Initializes the tenant repository provider and related services
   */
  constructor(
    private readonly tenantRepoProvider: TenantRepositoryProvider,
    private readonly usersService: UsersService,
    private readonly mealsService: MealsService,
    private readonly itemsService: ItemsService,
    private readonly couponsService: CouponsService,
    private readonly tablesService: TablesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('OrdersService');
    this.orderRepoPromise = this.tenantRepoProvider.getRepository(Order);
    this.orderMealItemRepoPromise =
      this.tenantRepoProvider.getRepository(OrderMealItem);
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
   * Validate that a table exists
   *
   * @param tableId Table ID to validate
   * @throws BadRequestException if table doesn't exist
   */
  private async validateTableExists(tableId: number) {
    return await validateEntityExists(tableId, this.tablesService, 'Table');
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
    try {
      await this.validateUserExists(createOrderDto.userId);

      let couponId: number | undefined = undefined;
      if (createOrderDto.couponCode) {
        try {
          const validationResponse = await this.couponsService.validateCoupon(
            createOrderDto.couponCode,
            createOrderDto.totalAmount,
          );

          if (!validationResponse.valid || !validationResponse.coupon) {
            throw new BadRequestException(
              validationResponse.message ||
                `Invalid coupon: ${createOrderDto.couponCode}`,
            );
          }

          couponId = validationResponse.coupon.id;
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

      if (createOrderDto.tableId) {
        await this.validateTableExists(createOrderDto.tableId);
      }

      const orderRepo = await this.orderRepoPromise;
      const order = orderRepo.create({
        userId: createOrderDto.userId,
        tableId: createOrderDto.tableId,
        orderType: createOrderDto.orderType,
        status: OrderStatus.PENDING,
        totalAmount: createOrderDto.totalAmount,
        specialInstructions: createOrderDto.specialInstructions,
        couponId: couponId,
      });
      const savedOrder = await orderRepo.save(order);

      if (createOrderDto.mealItems && createOrderDto.mealItems.length > 0) {
        const orderMealItemRepo = await this.orderMealItemRepoPromise;
        for (const mealItem of createOrderDto.mealItems) {
          const orderMealItem = orderMealItemRepo.create({
            orderId: savedOrder.id,
            mealId: mealItem.mealId,
            type: OrderItemType.MEAL,
            quantity: mealItem.quantity,
          });
          await orderMealItemRepo.save(orderMealItem);
        }
      }

      if (createOrderDto.menuItems && createOrderDto.menuItems.length > 0) {
        const orderMealItemRepo = await this.orderMealItemRepoPromise;
        for (const menuItem of createOrderDto.menuItems) {
          const orderMealItem = orderMealItemRepo.create({
            orderId: savedOrder.id,
            itemId: menuItem.itemId,
            type: OrderItemType.ITEM,
            quantity: menuItem.quantity,
          });
          await orderMealItemRepo.save(orderMealItem);
        }
      }

      if (createOrderDto.mealItems && createOrderDto.mealItems.length > 0) {
        this.logger.log('Processing ingredient quantities for meals in order');
        for (const mealItem of createOrderDto.mealItems) {
          try {
            const result = await this.mealsService.processOrder(
              mealItem.mealId,
              mealItem.quantity,
            );

            if (
              result.lowStockIngredients &&
              result.lowStockIngredients.length > 0
            ) {
              const ingredientDetails = result.lowStockIngredients
                .map(
                  (ing) =>
                    `${ing.name} (ID: ${ing.id}): ${ing.stock}/${ing.warningAt}`,
                )
                .join(', ');
              this.logger.warn(
                `Low stock ingredients detected after processing meal ID ${mealItem.mealId}: ${ingredientDetails}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Failed to process ingredient quantities for meal ID ${mealItem.mealId}`,
              (error as Error).message,
            );
          }
        }
      }

      if (createOrderDto.menuItems && createOrderDto.menuItems.length > 0) {
        this.logger.log(
          'Processing ingredient quantities for menu items in order',
        );
        for (const menuItem of createOrderDto.menuItems) {
          try {
            const result = await this.itemsService.processOrder(
              menuItem.itemId,
              menuItem.quantity,
            );

            if (
              result.lowStockIngredients &&
              result.lowStockIngredients.length > 0
            ) {
              const ingredientDetails = result.lowStockIngredients
                .map(
                  (ing) =>
                    `${ing.name} (ID: ${ing.id}): ${ing.stock}/${ing.warningAt}`,
                )
                .join(', ');
              this.logger.warn(
                `Low stock ingredients detected after processing item ID ${menuItem.itemId}: ${ingredientDetails}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Failed to process ingredient quantities for item ID ${menuItem.itemId}`,
              (error as Error).message,
            );
          }
        }
      }

      if (couponId) {
        await this.couponsService.incrementUsage(couponId);
      }

      return this.findOne(savedOrder.id);
    } catch (error: any) {
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
      const orderRepo = await this.orderRepoPromise;
      const order = await orderRepo.findOne({
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
    try {
      const orderMealItemRepository = await this.orderMealItemRepoPromise;
      const order = await this.findOne(id);

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Handle coupon code update if provided
      if (updateOrderDto.couponCode) {
        try {
          const validationResponse = await this.couponsService.validateCoupon(
            updateOrderDto.couponCode,
            updateOrderDto.totalAmount || order.totalAmount,
          );

          if (!validationResponse.valid || !validationResponse.coupon) {
            throw new BadRequestException(
              validationResponse.message ||
                `Invalid coupon: ${updateOrderDto.couponCode}`,
            );
          }

          order.couponId = validationResponse.coupon.id;
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          throw new BadRequestException(`Invalid coupon: ${errorMessage}`);
        }
      }

      if (updateOrderDto.userId) {
        order.userId = updateOrderDto.userId;
      }

      if (updateOrderDto.mealItems && updateOrderDto.mealItems.length > 0) {
        const mealIds = this.extractMealIds(updateOrderDto.mealItems);
        if (mealIds.length > 0) {
          await this.validateMealsExist(mealIds);

          await orderMealItemRepository.delete({
            orderId: order.id,
            type: OrderItemType.MEAL,
          });

          for (const mealItem of updateOrderDto.mealItems) {
            const orderMealItem = new OrderMealItem();
            orderMealItem.orderId = order.id;
            orderMealItem.mealId = mealItem.mealId;
            orderMealItem.type = OrderItemType.MEAL;
            orderMealItem.quantity = mealItem.quantity;

            await orderMealItemRepository.save(orderMealItem);
          }
        }
      }

      if (updateOrderDto.menuItems && updateOrderDto.menuItems.length > 0) {
        const itemIds = this.extractItemIds(updateOrderDto.menuItems);
        if (itemIds.length > 0) {
          await this.validateItemsExist(itemIds);
          await orderMealItemRepository.delete({
            orderId: order.id,
            type: OrderItemType.ITEM,
          });

          for (const menuItem of updateOrderDto.menuItems) {
            const orderMealItem = new OrderMealItem();
            orderMealItem.orderId = order.id;
            orderMealItem.itemId = menuItem.itemId;
            orderMealItem.type = OrderItemType.ITEM;
            orderMealItem.quantity = menuItem.quantity;

            await orderMealItemRepository.save(orderMealItem);
          }
        }
      }

      if (updateOrderDto.status) {
        order.status = updateOrderDto.status;
      }

      if (updateOrderDto.orderType) {
        order.orderType = updateOrderDto.orderType;
      }

      if (updateOrderDto.totalAmount) {
        order.totalAmount = updateOrderDto.totalAmount;
      }

      if (updateOrderDto.specialInstructions) {
        order.specialInstructions = updateOrderDto.specialInstructions;
      }

      const ordersRepository = await this.orderRepoPromise;
      await ordersRepository.update(order.id, {
        status: order.status,
        orderType: order.orderType,
        totalAmount: order.totalAmount,
        specialInstructions: order.specialInstructions,
        userId: order.userId,
        tableId: order.tableId,
        couponId: order.couponId,
      });

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
   * Soft delete an order by ID
   *
   * @param id Order ID
   */
  async remove(id: number): Promise<void> {
    try {
      const order = await this.findOne(id);

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      const orderRepo = await this.orderRepoPromise;
      await orderRepo.softDelete(id);
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

  /**
   * Restore a soft-deleted order
   *
   * @param id Order ID to restore
   */
  async restore(id: number): Promise<Order> {
    try {
      const orderRepo = await this.orderRepoPromise;
      const order = await orderRepo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (!order.deletedAt) {
        throw new BadRequestException(`Order with ID ${id} is not deleted`);
      }

      await orderRepo.restore(id);
      return this.findOne(id);
    } catch (err) {
      return handleError(
        err,
        [NotFoundException, BadRequestException],
        `Failed to restore order with ID ${id}`,
        () => {
          this.logger.logError(err, 'OrdersService.restore', { id });
        },
      );
    }
  }

  /**
   * Find all orders
   *
   * @returns List of all orders
   */
  async findAll(): Promise<Order[]> {
    try {
      const orderRepo = await this.orderRepoPromise;
      return await orderRepo.find({
        relations: [
          'user',
          'table',
          'coupon',
          'orderMealItems',
          'orderMealItems.meal',
          'orderMealItems.item',
        ],
      });
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve orders', () => {
        this.logger.logError(err, 'OrdersService.findAll');
      });
    }
  }

  /**
   * Find all orders including deleted ones
   *
   * @param includeDeleted Whether to include soft-deleted orders
   * @returns List of all orders
   */
  async findAllWithDeleted(includeDeleted: boolean = false): Promise<Order[]> {
    try {
      const orderRepo = await this.orderRepoPromise;
      return await orderRepo.find({
        relations: [
          'user',
          'table',
          'coupon',
          'orderMealItems',
          'orderMealItems.meal',
          'orderMealItems.item',
        ],
        withDeleted: includeDeleted,
      });
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve orders', () => {
        this.logger.logError(err, 'OrdersService.findAllWithDeleted');
      });
    }
  }

  /**
   * Find orders by user ID
   *
   * @param userId User ID
   * @returns List of orders for the specified user
   */
  async findByUserId(userId: number): Promise<Order[]> {
    try {
      await this.validateUserExists(userId);

      const orderRepo = await this.orderRepoPromise;
      return await orderRepo.find({
        where: { userId },
        relations: [
          'user',
          'table',
          'coupon',
          'orderMealItems',
          'orderMealItems.meal',
          'orderMealItems.item',
        ],
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, NotFoundException],
        `Failed to retrieve orders for user with ID ${userId}`,
        () => {
          this.logger.logError(err, 'OrdersService.findByUserId', { userId });
        },
      );
    }
  }
}
