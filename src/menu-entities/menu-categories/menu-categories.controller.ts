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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { MenuCategoriesService } from './menu-categories.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { MenuCategoryResponseDto } from './dto/menu-category-response.dto';

/**
 * Menu Categories Controller
 *
 * Handles menu category-related operations
 */
@ApiTags('menu-categories')
@Controller('menu-categories')
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
  @Post()
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

    return await this.menuCategoriesService.create(createMenuCategoryDto);
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
  async findAll(): Promise<MenuCategoryResponseDto[]> {
    this.logger.log('Retrieving all menu categories');

    return await this.menuCategoriesService.findAll();
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

    return await this.menuCategoriesService.findOne(id);
  }

  /**
   * Update a menu category
   *
   * @param id Menu category ID
   * @param updateMenuCategoryDto Menu category update data
   * @returns Updated menu category
   */
  @Patch(':id')
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

    return await this.menuCategoriesService.update(id, updateMenuCategoryDto);
  }

  /**
   * Delete a menu category
   *
   * @param id Menu category ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a menu category' })
  @ApiParam({ name: 'id', description: 'Menu category ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Menu category has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Menu category not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete menu category.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Deleting menu category with ID: ${id}`);

    await this.menuCategoriesService.remove(id);
  }
}
