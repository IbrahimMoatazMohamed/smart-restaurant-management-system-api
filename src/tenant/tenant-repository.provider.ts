import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EntityTarget, Repository, ObjectLiteral } from 'typeorm';
import { TenantConnectionService } from './tenant-connection.service';

/**
 * Provider for tenant-specific repositories
 * Scoped to each request to ensure correct tenant context
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantRepositoryProvider {
  constructor(
    private readonly tenantConnService: TenantConnectionService,
    @Inject(REQUEST) private readonly request: { tenantId: string },
  ) {}

  /**
   * Get a repository for a specific entity in the current tenant's database
   * @param entity The entity class
   * @returns Repository for the entity in the tenant's database
   */
  async getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
  ): Promise<Repository<T>> {
    const tenantId = this.request.tenantId;
    if (!tenantId) {
      throw new Error('Tenant ID not found in request');
    }

    const dataSource = await this.tenantConnService.getDataSource(tenantId);
    return dataSource.getRepository(entity);
  }
}
