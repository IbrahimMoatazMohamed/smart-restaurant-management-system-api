import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { MenuCategory } from './entities/menu-category.entity';
import { Item } from '../items/entities/item.entity';
import { Meal } from '../meals/entities/meal.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

/**
 * Menu Categories Service
 *
 * Handles business logic for menu categories including creation, retrieval,
 * update, and deletion of categories with standardized error handling
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class MenuCategoriesService {
  private menuCategoryRepoPromise: Promise<Repository<MenuCategory>>;

  /**
   * Constructor
   *
   * Initializes the menu category repository and custom logger
   */
  constructor(
    private readonly tenantRepoProvider: TenantRepositoryProvider,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MenuCategoriesService');
    this.menuCategoryRepoPromise =
      this.tenantRepoProvider.getRepository(MenuCategory);
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
    const menuCategoryRepository = await this.menuCategoryRepoPromise;
    const existingCategory = await menuCategoryRepository.findOne({
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

      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      const newCategory = menuCategoryRepository.create(createMenuCategoryDto);
      return await menuCategoryRepository.save(newCategory);
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
   * Find all menu categories with optional filtering
   *
   * @param includeDeleted Whether to include soft-deleted categories
   * @returns List of menu categories
   */
  async findAll(includeDeleted: boolean = false): Promise<MenuCategory[]> {
    try {
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      return await menuCategoryRepository.find({
        relations: ['items', 'meals'],
        withDeleted: includeDeleted,
      });
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
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      const category = await menuCategoryRepository.findOne({
        where: { id },
        relations: ['items'],
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
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      await menuCategoryRepository.update(id, updateMenuCategoryDto);

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
   * Soft delete a menu category with cascading soft delete for items and meals
   *
   * @param id Menu category ID
   */
  async remove(id: number): Promise<void> {
    try {
      this.logger.log(`Soft deleting menu category with ID: ${id}`);

      const menuCategory = await this.findOne(id);

      const menuCategoryRepository = await this.menuCategoryRepoPromise;

      // Get all items and meals that belong to this category
      const categoryWithRelations = await menuCategoryRepository.findOne({
        where: { id },
        relations: ['items', 'meals'],
      });

      if (categoryWithRelations) {
        // Soft delete all items in this category
        if (
          categoryWithRelations.items &&
          categoryWithRelations.items.length > 0
        ) {
          const itemRepository =
            await this.tenantRepoProvider.getRepository(Item);
          const itemIds = categoryWithRelations.items.map((item) => item.id);
          await itemRepository.softDelete(itemIds);
          this.logger.log(
            `Soft deleted ${itemIds.length} items from category ${id}`,
          );
        }

        // Soft delete all meals in this category
        if (
          categoryWithRelations.meals &&
          categoryWithRelations.meals.length > 0
        ) {
          const mealRepository =
            await this.tenantRepoProvider.getRepository(Meal);
          const mealIds = categoryWithRelations.meals.map((meal) => meal.id);
          await mealRepository.softDelete(mealIds);
          this.logger.log(
            `Soft deleted ${mealIds.length} meals from category ${id}`,
          );
        }
      }

      // Set category to inactive and soft delete it
      menuCategory.isActive = false;
      await menuCategoryRepository.save(menuCategory);
      await menuCategoryRepository.softDelete(id);

      this.logger.log(
        `Menu category with ID ${id} and all its items/meals soft deleted`,
      );
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to soft delete menu category with ID ${id}`,
        () => {
          this.logger.logError(err, 'MenuCategoriesService.remove', { id });
        },
      );
    }
  }

  /**
   * Restore a soft-deleted menu category
   *
   * @param id Menu category ID
   * @returns Restored menu category
   */
  async restore(id: number): Promise<MenuCategory> {
    try {
      // Validate that id is a valid number
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid menu category ID: ${id}`);
        throw new BadRequestException(`Invalid menu category ID: ${id}`);
      }

      this.logger.log(`Restoring soft-deleted menu category with ID: ${id}`);

      // Check if the category exists in deleted items
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      const deletedCategory = await menuCategoryRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!deletedCategory) {
        throw new NotFoundException(`Menu category with ID ${id} not found`);
      }

      if (!deletedCategory.deletedAt) {
        throw new BadRequestException(
          `Menu category with ID ${id} is not deleted`,
        );
      }

      // Use TypeORM's built-in restore method
      await menuCategoryRepository.restore(id);

      // Get the restored category
      const menuCategory = await this.findOne(id);

      // Update the category to be active and clear deletion metadata
      menuCategory.isActive = true;
      await menuCategoryRepository.save(menuCategory);
      this.logger.log(`Menu category with ID ${id} restored`);

      return this.findOne(id);
    } catch (err) {
      return handleError(
        err,
        [NotFoundException, BadRequestException],
        `Failed to restore menu category with ID ${id}`,
        () => {
          this.logger.logError(err, 'MenuCategoriesService.restore', { id });
        },
      );
    }
  }

  /**
   * Find all soft-deleted menu categories
   *
   * @returns List of soft-deleted menu categories
   */
  async findAllSoftDeleted(): Promise<MenuCategory[]> {
    try {
      this.logger.log('Finding all soft-deleted menu categories');

      // Use withDeleted to include soft-deleted entities and filter to only get deleted ones
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      const categories = await menuCategoryRepository.find({
        withDeleted: true,
        relations: ['items'],
      });

      this.logger.log(
        `Found ${categories.length} soft-deleted menu categories`,
      );
      return categories;
    } catch (err) {
      return handleError(
        err,
        [],
        'Failed to find soft-deleted menu categories',
        () =>
          this.logger.logError(
            err,
            'MenuCategoriesService.findAllSoftDeleted',
            {},
          ),
      );
    }
  }

  /**
   * Find menu categories by active status
   * @param isActive Active status to filter by
   * @returns Array of menu categories with the specified active status
   */
  async findByActiveStatus(isActive: boolean): Promise<MenuCategory[]> {
    try {
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      const categories = await menuCategoryRepository.find({
        where: { isActive },
        relations: ['items'],
      });

      this.logger.log(
        `Found ${categories.length} menu categories with isActive=${isActive}`,
      );
      return categories;
    } catch (err) {
      return handleError(
        err,
        [],
        `Failed to find menu categories with isActive=${isActive}`,
        () =>
          this.logger.logError(
            err,
            'MenuCategoriesService.findByActiveStatus',
            { isActive },
          ),
      );
    }
  }

  /**
   * Permanently delete a menu category (hard delete)
   *
   * @param id Menu category ID
   */
  async hardDelete(id: number): Promise<void> {
    try {
      // Check if category exists (including soft-deleted ones)
      const menuCategoryRepository = await this.menuCategoryRepoPromise;
      const category = await menuCategoryRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!category) {
        throw new NotFoundException(`Menu category with ID ${id} not found`);
      }

      // Permanently delete the category
      await menuCategoryRepository.delete(id);
    } catch (err) {
      handleError(
        err,
        [NotFoundException],
        `Failed to permanently delete menu category with ID ${id}`,
        () => {
          this.logger.logError(err, 'MenuCategoriesService.hardDelete', { id });
        },
      );
    }
  }
}
