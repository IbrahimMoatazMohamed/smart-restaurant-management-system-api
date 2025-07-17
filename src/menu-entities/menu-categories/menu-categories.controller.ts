import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseIntPipe,
  HttpCode,
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MenuCategoriesService } from './menu-categories.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { MenuCategoryResponseDto } from './dto/menu-category-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  AdminOnly,
  RequirePermissions,
} from '../../auth/decorators/roles.decorator';

/**
 * Menu Categories Controller
 *
 * Handles menu category-related operations
 */
@ApiTags('menu-categories')
@Controller('menu-categories')
@UseInterceptors(ClassSerializerInterceptor)
export class MenuCategoriesController {
  /**
   * Constructor
   *
   * Initializes the menu categories service and custom logger
   */
  constructor(
    private readonly menuCategoriesService: MenuCategoriesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MenuCategoriesController');
  }

  /**
   * Create a new menu category
   *
   * @param createMenuCategoryDto Menu category creation data
   * @returns Created menu category
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Post()
  @RequirePermissions('menuCategories.create')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new menu category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Menu category has been successfully created.',
    type: MenuCategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or duplicate category name.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create menu category.',
  })
  async create(
    @Body() createMenuCategoryDto: CreateMenuCategoryDto,
  ): Promise<MenuCategoryResponseDto> {
    this.logger.log(
      `Creating new menu category: ${createMenuCategoryDto.name}`,
    );

    const category = await this.menuCategoriesService.create(
      createMenuCategoryDto,
    );
    return new MenuCategoryResponseDto(category);
  }

  /**
   * Get all menu categories
   *
   * @returns List of all menu categories
   */
  @Get()
  @ApiOperation({ summary: 'Get all menu categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all menu categories.',
    type: [MenuCategoryResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve menu categories.',
  })
  async findAll(
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ): Promise<MenuCategoryResponseDto[]> {
    this.logger.log(
      `Retrieving all menu categories${includeDeleted ? ' including deleted' : ''}`,
    );

    const categories = await this.menuCategoriesService.findAll(includeDeleted);

    return categories.map((category) => new MenuCategoryResponseDto(category));
  }

  /**
   * Get a menu category by ID
   *
   * @param id Menu category ID
   * @returns Menu category
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a menu category by ID' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu category found.',
    type: MenuCategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve menu category.',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MenuCategoryResponseDto> {
    this.logger.log(`Retrieving menu category with ID: ${id}`);

    const category = await this.menuCategoriesService.findOne(id);
    return new MenuCategoryResponseDto(category);
  }

  /**
   * Update a menu category
   *
   * @param id Menu category ID
   * @param updateMenuCategoryDto Menu category update data
   * @returns Updated menu category
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Patch(':id')
  @RequirePermissions('menuCategories.update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a menu category' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu category has been successfully updated.',
    type: MenuCategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or duplicate category name.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update menu category.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuCategoryDto: UpdateMenuCategoryDto,
  ): Promise<MenuCategoryResponseDto> {
    this.logger.log(`Updating menu category with ID: ${id}`);

    const category = await this.menuCategoriesService.update(
      id,
      updateMenuCategoryDto,
    );
    return new MenuCategoryResponseDto(category);
  }

  /**
   * Soft delete a menu category
   *
   * @param id Menu category ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @Delete(':id')
  @RequirePermissions('menuCategories.delete')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a menu category' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Menu category has been successfully soft-deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete menu category.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Soft deleting menu category with ID: ${id}`);

    await this.menuCategoriesService.remove(id);
  }

  /**
   * Restore a soft-deleted menu category
   *
   * @param id Menu category ID
   * @returns Restored menu category
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('menuCategories.delete')
  @Post(':id/restore')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore a soft-deleted menu category' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu category has been successfully restored.',
    type: MenuCategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiBadRequestResponse({
    description: 'Menu category is not deleted.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to restore menu category.',
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MenuCategoryResponseDto> {
    this.logger.log(`Restoring menu category with ID: ${id}`);

    const category = await this.menuCategoriesService.restore(id);
    return new MenuCategoryResponseDto(category);
  }

  /**
   * Find all soft-deleted menu categories
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('menuCategories.read')
  @Get('deleted')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Find all soft-deleted menu categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of soft-deleted menu categories.',
    type: [MenuCategoryResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve soft-deleted menu categories.',
  })
  async findAllSoftDeleted(): Promise<MenuCategoryResponseDto[]> {
    this.logger.log('Finding all soft-deleted menu categories');

    const categories = await this.menuCategoriesService.findAllSoftDeleted();
    return categories.map((category) => new MenuCategoryResponseDto(category));
  }

  /**
   * Find menu categories by active status
   *
   * @param isActive Active status to filter by
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('menuCategories.read')
  @Get('by-status/:isActive')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Find menu categories by active status' })
  @ApiParam({ name: 'isActive', description: 'Active status (true/false)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of menu categories with specified status.',
    type: [MenuCategoryResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve menu categories by status.',
  })
  async findByActiveStatus(
    @Param('isActive', new ParseBoolPipe()) isActive: boolean,
  ): Promise<MenuCategoryResponseDto[]> {
    this.logger.log(`Finding menu categories with isActive=${isActive}`);

    const categories =
      await this.menuCategoriesService.findByActiveStatus(isActive);

    return categories.map((category) => new MenuCategoryResponseDto(category));
  }

  /**
   * Soft delete a menu category using a dedicated endpoint
   *
   * @param id Menu category ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('menuCategories.delete')
  @Delete(':id/soft-delete')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a menu category (dedicated endpoint)' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Menu category has been successfully soft-deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to soft delete menu category.',
  })
  async softDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(
      `Soft deleting menu category with ID: ${id} (dedicated endpoint)`,
    );

    await this.menuCategoriesService.remove(id);
  }

  /**
   * Hard delete a menu category (permanent deletion)
   *
   * @param id Menu category ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('menuCategories.delete')
  @Delete(':id/hard-delete')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard delete a menu category (permanent deletion)' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Menu category has been permanently deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to permanently delete menu category.',
  })
  async hardDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Hard deleting menu category with ID: ${id}`);

    await this.menuCategoriesService.hardDelete(id);
  }
}
