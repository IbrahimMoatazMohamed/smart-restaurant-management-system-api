import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminOnly, Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { OrderAnalyticsDto } from './dto/order-analytics.dto';
import { HourlyRevenueDto } from './dto/hourly-revenue.dto';
import { Order } from '../order-entities/orders/entities/order.entity';
import { CategoryDistributionDto } from './dto/category-distribution.dto';
import { TableStatusDto } from './dto/table-status.dto';
import { TopMealDto } from './dto/top-meal.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiResponse({
  status: 401,
  description: 'Unauthorized - User is not logged in',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - User does not have admin role',
})
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @AdminOnly()
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns key metrics for the dashboard including active orders, completed orders, available tables, occupied tables, and menu items count',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: [DashboardStatsDto],
  })
  async getDashboardStats(): Promise<any[]> {
    return await this.dashboardService.getDashboardStats();
  }

  @Get('orders-analytics')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get order analytics data',
    description:
      'Returns order counts grouped by status for analytics purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'Order analytics data retrieved successfully',
    type: [OrderAnalyticsDto],
  })
  async getOrderAnalytics(): Promise<any[]> {
    return await this.dashboardService.getOrderAnalytics();
  }

  @Get('hourly-revenue')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get hourly revenue data',
    description: 'Returns revenue data broken down by hour for the current day',
  })
  @ApiResponse({
    status: 200,
    description: 'Hourly revenue data retrieved successfully',
    type: [HourlyRevenueDto],
  })
  async getHourlyRevenue(): Promise<any[]> {
    return await this.dashboardService.getHourlyRevenue();
  }

  @Get('category-distribution')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get meal category distribution',
    description:
      'Returns the distribution of meals across different categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Category distribution data retrieved successfully',
    type: [CategoryDistributionDto],
  })
  async getCategoryDistribution(): Promise<any[]> {
    return await this.dashboardService.getCategoryDistribution();
  }

  @Get('table-status')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get table status data',
    description: 'Returns the count of tables grouped by their current status',
  })
  @ApiResponse({
    status: 200,
    description: 'Table status data retrieved successfully',
    type: [TableStatusDto],
  })
  async getTableStatus(): Promise<any[]> {
    return await this.dashboardService.getTableStatus();
  }

  @Get('top-meals')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get top selling meals',
    description:
      'Returns the top 5 meals based on price (or sales in a real implementation)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top meals retrieved successfully',
    type: [TopMealDto],
  })
  async getTopMeals(): Promise<any[]> {
    return await this.dashboardService.getTopMeals();
  }

  @Get('recent-orders')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get recent orders',
    description: 'Returns the 5 most recent orders placed in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent orders retrieved successfully',
    type: [Order],
  })
  async getRecentOrders(): Promise<any[]> {
    return await this.dashboardService.getRecentOrders();
  }
}
