import { Module, forwardRef } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { LoggerModule } from '../../logger/logger.module';
import { MenuCategoriesModule } from '../menu-categories/menu-categories.module';
import { ItemIngredientsModule } from '../item-ingredients/item-ingredients.module';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { FileUploadModule } from '../../file-upload/file-upload.module';
import { TenantModule } from '../../tenant/tenant.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TenantModule,
    AuthModule,
    LoggerModule,
    MenuCategoriesModule,
    FileUploadModule,
    forwardRef(() => ItemIngredientsModule),
    forwardRef(() => IngredientsModule),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
