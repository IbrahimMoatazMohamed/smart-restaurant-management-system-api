import { Module } from '@nestjs/common';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantRepositoryProvider } from './tenant-repository.provider';

@Module({
  providers: [TenantConnectionService, TenantRepositoryProvider],
  exports: [TenantConnectionService, TenantRepositoryProvider],
})
export class TenantModule {}
