import { Module } from '@nestjs/common';
import { MenuCategoriesService } from './menu-categories.service';
import { MenuCategoriesController } from './menu-categories.controller';
import { LoggerModule } from '../../logger/logger.module';
import { TenantModule } from '../../tenant/tenant.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [LoggerModule, TenantModule, AuthModule],
  controllers: [MenuCategoriesController],
  providers: [MenuCategoriesService],
  exports: [MenuCategoriesService],
})
export class MenuCategoriesModule {}
