/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Users } from '../users/entities/users.entity';
import { IngredientCategory } from '../menu-entities/ingredient-categories/entities/ingredient-category.entity';
import { Ingredient } from '../menu-entities/ingredients/entities/ingredient.entity';
import { ItemIngredient } from '../menu-entities/item-ingredients/entities/item-ingredient.entity';
import { Item } from '../menu-entities/items/entities/item.entity';
import { MealItem } from '../menu-entities/meal-items/entities/meal-item.entity';
import { Meal } from '../menu-entities/meals/entities/meal.entity';
import { MenuCategory } from '../menu-entities/menu-categories/entities/menu-category.entity';
import { Coupon } from '../order-entities/coupons/entities/coupon.entity';
import { OrderMealItem } from '../order-entities/orders/entities/order-meal-item.entity';
import { Order } from '../order-entities/orders/entities/order.entity';
import { TableReservation } from '../order-entities/table-reservations/entities/table-reservation.entity';
import { Table } from '../order-entities/tables/entities/table.entity';

/**
 * Service to manage tenant-specific database connections
 * Creates and caches database connections for each tenant
 */
@Injectable()
export class TenantConnectionService {
  private dataSources = new Map<string, DataSource>();

  /**
   * Get or create a DataSource for a specific tenant
   * @param tenantId The tenant identifier
   * @returns DataSource instance for the tenant
   */
  async getDataSource(tenantId: string): Promise<DataSource> {
    const dbName = `smart-restaurant-management-${tenantId}`;

    if (this.dataSources.has(dbName)) {
      const dataSource = this.dataSources.get(dbName);
      if (dataSource) {
        return dataSource;
      }
    }

    const dataSource = new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      entities: [
        Role,
        Users,
        IngredientCategory,
        Ingredient,
        ItemIngredient,
        Item,
        MealItem,
        Meal,
        MenuCategory,
        Coupon,
        OrderMealItem,
        Order,
        TableReservation,
        Table,
      ],
      synchronize: false,
    });

    try {
      await dataSource.initialize();
    } catch (error: any) {}

    this.dataSources.set(dbName, dataSource);
    return dataSource;
  }
}
