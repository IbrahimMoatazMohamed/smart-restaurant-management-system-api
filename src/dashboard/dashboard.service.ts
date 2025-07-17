import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../logger/logger.service';
import { handleError } from '../utils/error-handler.util';
import { OrdersService } from '../order-entities/orders/orders.service';
import { MealsService } from '../menu-entities/meals/meals.service';
import { TablesService } from '../order-entities/tables/tables.service';
import { OrderStatus } from '../order-entities/orders/entities/order.entity';
import { TableStatus } from '../order-entities/tables/entities/table.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly mealsService: MealsService,
    private readonly tablesService: TablesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('DashboardService');
  }

  /**
   * Get dashboard statistics
   * @returns Dashboard statistics
   */
  async getDashboardStats(): Promise<any[]> {
    try {
      // Get all orders and filter by status
      const orders = await this.ordersService.findAll();
      const activeOrders = orders.filter(
        (order) => order.status === OrderStatus.PREPARING,
      ).length;
      const completedOrders = orders.filter(
        (order) => order.status === OrderStatus.DELIVERED,
      ).length;

      // Get all tables and filter by status
      const tables = await this.tablesService.findAll();
      const availableTables = tables.filter(
        (table) => table.status === TableStatus.AVAILABLE,
      ).length;
      const occupiedTables = tables.filter(
        (table) => table.status === TableStatus.OCCUPIED,
      ).length;

      // Get menu items count
      const meals = await this.mealsService.findAll();
      const menuItems = meals.length;

      return [
        {
          label: 'Active Orders',
          value: activeOrders,
          change: 0,
          trend: 'neutral',
          color: 'bg-blue-100 text-blue-800',
        },
        {
          label: 'Completed Orders',
          value: completedOrders,
          change: 0,
          trend: 'up',
          color: 'bg-green-100 text-green-800',
        },
        {
          label: 'Available Tables',
          value: availableTables,
          change: 0,
          trend: 'neutral',
          color: 'bg-yellow-100 text-yellow-800',
        },
        {
          label: 'Occupied Tables',
          value: occupiedTables,
          change: 0,
          trend: 'down',
          color: 'bg-red-100 text-red-800',
        },
        {
          label: 'Menu Items',
          value: menuItems,
          change: 0,
          trend: 'neutral',
          color: 'bg-purple-100 text-purple-800',
        },
      ];
    } catch (error: unknown) {
      return handleError(
        error,
        [],
        'Failed to get dashboard statistics',
        () => {
          this.logger.error(
            `Error getting dashboard statistics: ${(error as Error).message}`,
          );
        },
      );
    }
  }

  /**
   * Get order analytics
   * @returns Order analytics data
   */
  async getOrderAnalytics(): Promise<any[]> {
    try {
      // Get all orders and group by status
      const orders = await this.ordersService.findAll();

      // Group orders by status
      const ordersByStatus: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (!ordersByStatus[order.status]) {
          ordersByStatus[order.status] = 0;
        }
        ordersByStatus[order.status]++;
      });

      // Convert to array format needed for frontend
      return Object.entries(ordersByStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }));
    } catch (error: unknown) {
      return handleError(error, [], 'Failed to get order analytics', () => {
        this.logger.error(
          `Error getting order analytics: ${(error as Error).message}`,
        );
      });
    }
  }

  /**
   * Get hourly revenue data
   * @returns Hourly revenue data
   */
  async getHourlyRevenue(): Promise<any[]> {
    try {
      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all orders
      const allOrders = await this.ordersService.findAll();

      // Filter orders for today with completed status
      const orders = allOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && order.status === OrderStatus.DELIVERED;
      });

      // Initialize hourly data
      const hourlyData = Array(24)
        .fill(0)
        .map((_, i) => ({
          name: `${i}:00`,
          value: 0,
        }));

      // Calculate revenue for each hour
      orders.forEach((order) => {
        const hour = new Date(order.createdAt).getHours();
        hourlyData[hour].value += order.totalAmount || 0;
      });

      return hourlyData;
    } catch (error: unknown) {
      return handleError(error, [], 'Failed to get hourly revenue', () => {
        this.logger.error(
          `Error getting hourly revenue: ${(error as Error).message}`,
        );
      });
    }
  }

  /**
   * Get meal category distribution
   * @returns Category distribution data
   */
  async getCategoryDistribution(): Promise<any[]> {
    try {
      // Get all meals
      const meals = await this.mealsService.findAll();

      // Group meals by category
      const categoryMap: { [key: string]: number } = {};
      meals.forEach((meal) => {
        const category = meal.category?.name || 'Uncategorized';
        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }
        categoryMap[category]++;
      });

      // Convert to array format needed for frontend
      return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }));
    } catch (error: unknown) {
      return handleError(
        error,
        [],
        'Failed to get category distribution',
        () => {
          this.logger.error(
            `Error getting category distribution: ${(error as Error).message}`,
          );
        },
      );
    }
  }

  /**
   * Get table status data
   * @returns Table status data
   */
  async getTableStatus(): Promise<any[]> {
    try {
      const tables = await this.tablesService.findAll();
      const tableStatusCounts: { [key: string]: number } = {};
      tables.forEach((table) => {
        if (!tableStatusCounts[table.status]) {
          tableStatusCounts[table.status] = 0;
        }
        tableStatusCounts[table.status]++;
      });
      return Object.entries(tableStatusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      }));
    } catch (error: unknown) {
      return handleError(error, [], 'Failed to get table status', () => {
        this.logger.error(
          `Error getting table status: ${(error as Error).message}`,
        );
      });
    }
  }

  /**
   * Get top selling meals
   * @returns Top selling meals
   */
  async getTopMeals(): Promise<any[]> {
    try {
      // Get all meals
      const meals = await this.mealsService.findAll();

      // Sort by price (descending) and take top 5
      // This is a simplified version. In a real app, you would use order frequency
      const topMeals = [...meals]
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, 5)
        .map((meal) => ({
          id: meal.id,
          name: meal.name,
          price: meal.price,
          description: meal.description,
          // Only include image if it exists in the meal object
          ...('image' in meal && meal.image ? { image: meal.image } : {}),
        }));

      return topMeals;
    } catch (error: unknown) {
      return handleError(error, [], 'Failed to get top meals', () => {
        this.logger.error(
          `Error getting top meals: ${(error as Error).message}`,
        );
      });
    }
  }

  /**
   * Get recent orders
   * @returns Recent orders
   */
  async getRecentOrders(): Promise<any[]> {
    try {
      // Get all orders
      const allOrders = await this.ordersService.findAll();

      // Sort by creation date (descending) and take top 5
      const recentOrders = [...allOrders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

      return recentOrders;
    } catch (error: unknown) {
      return handleError(error, [], 'Failed to get recent orders', () => {
        this.logger.error(
          `Error getting recent orders: ${(error as Error).message}`,
        );
      });
    }
  }
}
