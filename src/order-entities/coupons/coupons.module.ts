import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { LoggerModule } from '../../logger/logger.module';
import { TenantModule } from '../../tenant/tenant.module';

@Module({
  imports: [LoggerModule, TenantModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
