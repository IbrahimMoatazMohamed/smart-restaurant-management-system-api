import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './logger/logger.module';
import { IngredientsModule } from './menu-entities/ingredients/ingredients.module';
import { ItemsModule } from './menu-entities/items/items.module';
import { MealsModule } from './menu-entities/meals/meals.module';
import { OrdersModule } from './order-entities/orders/orders.module';
import { TablesModule } from './order-entities/tables/tables.module';
import { MenuCategoriesModule } from './menu-entities/menu-categories/menu-categories.module';
import { ItemIngredientsModule } from './menu-entities/item-ingredients/item-ingredients.module';
import { CouponsModule } from './order-entities/coupons/coupons.module';
import { AuthModule } from './auth/auth.module';
import { IngredientCategoriesModule } from './menu-entities/ingredient-categories/ingredient-categories.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MealItemsModule } from './menu-entities/meal-items/meal-items.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT as string) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smart_restaurant',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
