import { Module } from '@nestjs/common';
import { TenantModule } from '../../tenant/tenant.module';
import { LoggerModule } from '../../logger/logger.module';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

@Module({
  imports: [TenantModule, LoggerModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
