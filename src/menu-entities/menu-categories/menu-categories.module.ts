import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoriesService } from './menu-categories.service';
import { MenuCategoriesController } from './menu-categories.controller';
import { MenuCategory } from './entities/menu-category.entity';
import { LoggerModule } from '../../logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategory]), LoggerModule],
  controllers: [MenuCategoriesController],
  providers: [MenuCategoriesService],
  exports: [MenuCategoriesService],
})
export class MenuCategoriesModule {}
