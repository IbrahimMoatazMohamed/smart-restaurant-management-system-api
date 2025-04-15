import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { MenuCategory } from './entities/menu-category.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';

/**
 * Menu Categories Service
 *
 * Handles business logic for menu categories including creation, retrieval,
 * update, and deletion of categories with standardized error handling
 */
@Injectable()
export class MenuCategoriesService {
  /**
   * Constructor
   *
   * Initializes the menu category repository and custom logger
   */
  constructor(
    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MenuCategoriesService');
  }

  /**
   * Check if a category name already exists
   *
   * @param name Category name to check
   * @param excludeCategoryId Optional category ID to exclude from the check
   * @throws ConflictException if category name already exists
   */
  private async checkCategoryNameExists(
    name: string,
    excludeCategoryId?: number,
  ): Promise<void> {
    const existingCategory = await this.menuCategoryRepository.findOne({
      where: { name },
    });

    if (
      existingCategory &&
      (!excludeCategoryId || existingCategory.id !== excludeCategoryId)
    ) {
      throw new ConflictException(
        `A menu category with name "${name}" already exists`,
      );
    }
  }

  /**
   * Create a new menu category
   *
   * @param createMenuCategoryDto Menu category creation data
   * @returns Created menu category
   */
  async create(createMenuCategoryDto: CreateMenuCategoryDto) {
    try {
      // Check if category name already exists
      await this.checkCategoryNameExists(createMenuCategoryDto.name);

      const newCategory = this.menuCategoryRepository.create(
        createMenuCategoryDto,
      );
      return await this.menuCategoryRepository.save(newCategory);
    } catch (err) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        err,
        `A menu category with name "${createMenuCategoryDto.name}" already exists`,
        () => {
          this.logger.error(
            `Database conflict: Category name "${createMenuCategoryDto.name}" already exists`,
            JSON.stringify(err),
          );
        },
      );

      // Handle other errors
      return handleError(
        err,
        [ConflictException],
        'Failed to create menu category',
        () => {
          this.logger.logError(err, 'MenuCategoriesService.create', {
            dto: createMenuCategoryDto,
          });
        },
      );
    }
  }

  /**
   * Find all menu categories
   *
   * @returns List of all menu categories
   */
  async findAll() {
    try {
      return await this.menuCategoryRepository.find();
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve menu categories', () => {
        this.logger.logError(err, 'MenuCategoriesService.findAll');
      });
    }
  }

  /**
   * Find a menu category by ID
   *
   * @param id Menu category ID
   * @returns The found menu category
   */
  async findOne(id: number) {
    try {
      const category = await this.menuCategoryRepository.findOne({
        where: { id },
      });

      if (!category) {
        throw new NotFoundException(`Menu category with ID ${id} not found`);
      }

      return category;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to retrieve menu category with ID ${id}`,
        () => {
          this.logger.logError(err, 'MenuCategoriesService.findOne', { id });
        },
      );
    }
  }

  /**
   * Update a menu category
   *
   * @param id Menu category ID
   * @param updateMenuCategoryDto Menu category update data
   * @returns Updated menu category
   */
  async update(id: number, updateMenuCategoryDto: UpdateMenuCategoryDto) {
    try {
      // Check if category exists
      const existingCategory = await this.findOne(id);

      // If updating name, check if the new name already exists for another category
      if (
        updateMenuCategoryDto.name &&
        updateMenuCategoryDto.name !== existingCategory.name
      ) {
        await this.checkCategoryNameExists(updateMenuCategoryDto.name, id);
      }

      // Update the category
      await this.menuCategoryRepository.update(id, updateMenuCategoryDto);

      return this.findOne(id);
    } catch (err) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        err,
        `A menu category with name "${updateMenuCategoryDto.name}" already exists`,
        () => {
          this.logger.error(
            `Database conflict: Category name "${updateMenuCategoryDto.name}" already exists`,
            JSON.stringify(err),
          );
        },
      );

      // Handle other errors
      return handleError(
        err,
        [ConflictException, BadRequestException, NotFoundException],
        `Failed to update menu category with ID ${id}`,
        () => {
          this.logger.logError(err, 'MenuCategoriesService.update', {
            id,
            dto: updateMenuCategoryDto,
          });
        },
      );
    }
  }

  /**
   * Remove a menu category
   *
   * @param id Menu category ID
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if category exists
      await this.findOne(id);

      await this.menuCategoryRepository.delete(id);
    } catch (err) {
      handleError(
        err,
        [NotFoundException],
        `Failed to delete menu category with ID ${id}`,
        () => {
          this.logger.logError(err, 'MenuCategoriesService.remove', { id });
        },
      );
    }
  }
}
