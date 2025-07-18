/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

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
      entities: [__dirname + '/../**/**/*.entity{.ts,.js}'],
      synchronize: false,
    });

    try {
      await dataSource.initialize();
    } catch (error: any) {}

    this.dataSources.set(dbName, dataSource);
    return dataSource;
  }
}
