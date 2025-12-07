import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './logger/logger.module';
import { TenantModule } from './tenant/tenant.module';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CouponsModule } from './order-entities/coupons/coupons.module';
import { TablesModule } from './order-entities/tables/tables.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { IngredientCategoriesModule } from './menu-entities/ingredient-categories/ingredient-categories.module';
import { TableReservationsModule } from './order-entities/table-reservations/table-reservations.module';
import { IngredientsModule } from './menu-entities/ingredients/ingredients.module';
import { ItemsModule } from './menu-entities/items/items.module';
import { ItemIngredientsModule } from './menu-entities/item-ingredients/item-ingredients.module';
import { MenuCategoriesModule } from './menu-entities/menu-categories/menu-categories.module';
import { MealsModule } from './menu-entities/meals/meals.module';
import { OrdersModule } from './order-entities/orders/orders.module';
import { MealItemsModule } from './menu-entities/meal-items/meal-items.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TenantModule,
    // ServeStaticModule removed - using Cloudinary for file serving
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'uploads'),
    //   serveRoot: '/api/uploads',
    // }),
    LoggerModule,
    UsersModule,
    AuthModule,
    IngredientsModule,
    ItemsModule,
    MealsModule,
    OrdersModule,
    TablesModule,
    MenuCategoriesModule,
    ItemIngredientsModule,
    CouponsModule,
    IngredientCategoriesModule,
    FileUploadModule,
    MealItemsModule,
    TableReservationsModule,
    RolesModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
