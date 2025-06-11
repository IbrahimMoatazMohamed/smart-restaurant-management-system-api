import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CreateMealDto } from './dto/create-meal.dto';
import { UpdateMealDto } from './dto/update-meal.dto';
import { Meal } from './entities/meal.entity';
import { ItemsService } from 'src/menu-entities/items/items.service';
import { MenuCategoriesService } from 'src/menu-entities/menu-categories/menu-categories.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';

/**
 * Meals Service
 *
 * Handles meal-related operations
 */
@Injectable()
export class MealsService {
  /**
   * Constructor
   *
   * Initializes the meals repository, items service, menu categories service, and custom logger
   */
  constructor(
    @InjectRepository(Meal)
    private readonly mealsRepository: Repository<Meal>,
    private readonly itemsService: ItemsService,
    private readonly menuCategoriesService: MenuCategoriesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MealsService');
  }

  /**
   * Check if a meal name already exists
   *
   * @param name Meal name to check
   * @param excludeMealId Optional meal ID to exclude from the check
   * @throws ConflictException if meal name already exists
   */
  private async checkMealNameExists(
    name: string,
    excludeMealId?: number,
  ): Promise<void> {
    const existingMeal = await this.mealsRepository.findOne({
      where: { name },
    });

    if (existingMeal && (!excludeMealId || existingMeal.id !== excludeMealId)) {
      throw new ConflictException('Meal name already exists');
    }
  }

  /**
   * Create a new meal
   *
   * @param createMealDto Meal creation data
   * @returns Created meal
   */
  async create(createMealDto: CreateMealDto) {
    try {
      // Check if meal name already exists
      await this.checkMealNameExists(createMealDto.name);

      // Verify that the category exists
      await validateEntityExists(
        createMealDto.categoryId,
        this.menuCategoriesService,
        'Category',
      );

      // Create the meal without items first
      const { itemIds, mealItems, ...mealData } = createMealDto;
      const meal = this.mealsRepository.create(mealData);
      const savedMeal = await this.mealsRepository.save(meal);

      // Handle items with quantities if provided
      if (mealItems && mealItems.length > 0) {
        // Verify all items exist
        await Promise.all(
          mealItems.map(async (mealItem) => {
            await validateEntityExists(
              mealItem.itemId,
              this.itemsService,
              'Item',
            );
          }),
        );

        const mealItemEntities = mealItems.map((mealItem) => ({
          mealId: savedMeal.id,
          itemId: mealItem.itemId,
          quantity: mealItem.quantity,
        }));

        await this.mealsRepository.manager.query(
          `INSERT INTO meal_items (meal_id, item_id, quantity) VALUES ${mealItemEntities
            .map(() => '(?, ?, ?)')
            .join(', ')}`,
          mealItemEntities.flatMap((item) => [
            item.mealId,
            item.itemId,
            item.quantity,
          ]),
        );

        // Also update the items relation for backward compatibility
        const items = await Promise.all(
          mealItems.map((mealItem) =>
            this.itemsService.findOne(mealItem.itemId),
          ),
        );
        savedMeal.items = items;
        await this.mealsRepository.save(savedMeal);
      }
      // Handle legacy itemIds if mealItems is not provided
      else if (itemIds && itemIds.length > 0) {
        // Verify all items exist and get their details
        const items = await Promise.all(
          itemIds.map(async (id) => {
            await validateEntityExists(id, this.itemsService, 'Item');
            return this.itemsService.findOne(id);
          }),
        );

        // Update the meal with items
        savedMeal.items = items;
        await this.mealsRepository.save(savedMeal);
      }

      return this.findOne(savedMeal.id);
    } catch (err) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(err, 'Meal name already exists', () => {
        this.logger.error(
          'Database conflict: Meal name already exists',
          JSON.stringify(err),
        );
      });

      // Handle other errors
      return handleError(
        err,
        [ConflictException, BadRequestException, NotFoundException],
        'Failed to create meal',
        () => {
          this.logger.logError(err, 'MealsService.create', {
            dto: createMealDto,
          });
        },
      );
    }
  }

  /**
   * Find all meals with optional filtering
   *
   * @param includeDeleted Whether to include soft-deleted meals
   * @returns List of all meals
   */
  async findAll(includeDeleted: boolean = false) {
    try {
      return await this.mealsRepository.find({
        relations: ['items', 'category'],
        withDeleted: includeDeleted,
      });
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve meals', () => {
        this.logger.logError(err, 'MealsService.findAll');
      });
    }
  }

  /**
   * Find one meal by ID
   *
   * @param id Meal ID
   * @returns The found meal
   */
  async findOne(id: number) {
    try {
      const meal = await this.mealsRepository.findOne({
        where: { id },
      });

      if (!meal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      return meal;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to retrieve meal with ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.findOne', { id });
        },
      );
    }
  }

  /**
   * Update a meal
   *
   * @param id Meal ID
   * @param updateMealDto Meal update data
   * @returns Updated meal
   */
  async update(id: number, updateMealDto: UpdateMealDto) {
    try {
      // Check if meal exists
      const existingMeal = await this.findOne(id);

      // If updating name, check if it already exists
      if (updateMealDto.name && updateMealDto.name !== existingMeal.name) {
        await this.checkMealNameExists(updateMealDto.name, id);
      }

      // If updating category, verify it exists
      if (updateMealDto.categoryId) {
        await validateEntityExists(
          updateMealDto.categoryId,
          this.menuCategoriesService,
          'Category',
        );
      }

      // Only update allowed fields
      const allowedFields = [
        'name',
        'description',
        'price',
        'categoryId',
        'status',
        'photo',
      ];
      const updatedFields = Object.fromEntries(
        Object.entries(updateMealDto).filter(
          ([key, value]) => allowedFields.includes(key) && value !== undefined,
        ),
      );

      await this.mealsRepository.update(id, updatedFields);

      // Handle meal items with quantities if provided
      if (updateMealDto.mealItems && updateMealDto.mealItems.length > 0) {
        // Verify all items exist
        await Promise.all(
          updateMealDto.mealItems.map(async (mealItem) => {
            await validateEntityExists(
              mealItem.itemId,
              this.itemsService,
              'Item',
            );
          }),
        );

        // First, delete existing meal items
        await this.mealsRepository.manager.query(
          'DELETE FROM meal_items WHERE meal_id = ?',
          [id],
        );

        // Create meal items with quantities
        const mealItemEntities = updateMealDto.mealItems.map((mealItem) => ({
          mealId: id,
          itemId: mealItem.itemId,
          quantity: mealItem.quantity,
        }));

        // Insert new meal items
        await this.mealsRepository.manager.query(
          `INSERT INTO meal_items (meal_id, item_id, quantity) VALUES ${mealItemEntities
            .map(() => '(?, ?, ?)')
            .join(', ')}`,
          mealItemEntities.flatMap((item) => [
            item.mealId,
            item.itemId,
            item.quantity,
          ]),
        );

        // Also update the items relation for backward compatibility
        const items = await Promise.all(
          updateMealDto.mealItems.map((mealItem) =>
            this.itemsService.findOne(mealItem.itemId),
          ),
        );

        // Get the meal with relations
        const meal = await this.mealsRepository.findOne({
          where: { id },
          relations: ['items'],
        });

        if (meal) {
          meal.items = items;
          await this.mealsRepository.save(meal);
        }
      }
      // If item IDs are provided but no meal items, update the items relation using the legacy approach
      else if (updateMealDto.itemIds && updateMealDto.itemIds.length > 0) {
        const items = await Promise.all(
          updateMealDto.itemIds.map((itemId) =>
            this.itemsService.findOne(itemId),
          ),
        );

        // Get the meal with relations
        const meal = await this.mealsRepository.findOne({
          where: { id },
          relations: ['items'],
        });

        if (meal) {
          meal.items = items;
          await this.mealsRepository.save(meal);
        }
      }

      return this.findOne(id);
    } catch (err) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(err, 'Meal name already exists', () => {
        this.logger.error(
          'Database conflict: Meal name already exists',
          JSON.stringify(err),
        );
      });

      // Handle other errors
      return handleError(
        err,
        [ConflictException, BadRequestException, NotFoundException],
        `Failed to update meal with ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.update', {
            id,
            dto: updateMealDto,
          });
        },
      );
    }
  }

  /**
   * Soft delete a meal
   *
   * @param id Meal ID
   */
  async remove(id: number): Promise<void> {
    try {
      this.logger.log(`Soft deleting meal with ID: ${id}`);

      const meal = await this.findOne(id);

      meal.isActive = false;
      await this.mealsRepository.save(meal);

      await this.mealsRepository.softDelete(id);
      this.logger.log(`Meal with ID ${id} soft deleted`);
    } catch (err) {
      handleError(
        err,
        [NotFoundException],
        `Failed to soft delete meal with ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.remove', { id });
        },
      );
    }
  }

  /**
   * Restore a soft-deleted meal
   *
   * @param id Meal ID
   * @returns Restored meal
   */
  async restore(id: number): Promise<Meal> {
    try {
      // Validate that id is a valid number
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid meal ID: ${id}`);
        throw new BadRequestException(`Invalid meal ID: ${id}`);
      }

      this.logger.log(`Restoring soft-deleted meal with ID: ${id}`);

      // Check if the meal exists in deleted items
      const deletedMeal = await this.mealsRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!deletedMeal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      if (!deletedMeal.deletedAt) {
        throw new BadRequestException(`Meal with ID ${id} is not deleted`);
      }

      // Use TypeORM's built-in restore method
      await this.mealsRepository.restore(id);

      // Get the restored meal
      const meal = await this.findOne(id);

      // Update the meal to be active and clear deletion metadata
      meal.isActive = true;
      await this.mealsRepository.save(meal);
      this.logger.log(`Meal with ID ${id} restored`);

      return this.findOne(id);
    } catch (err) {
      return handleError(
        err,
        [NotFoundException, BadRequestException],
        `Failed to restore meal with ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.restore', { id });
        },
      );
    }
  }

  /**
   * Find all soft-deleted meals
   *
   * @returns List of soft-deleted meals
   */
  async findAllSoftDeleted(): Promise<Meal[]> {
    try {
      this.logger.log('Finding all soft-deleted meals');

      // Use withDeleted to include soft-deleted entities and filter to only get deleted ones
      const meals = await this.mealsRepository.find({
        withDeleted: true,
        relations: ['items', 'category'],
        where: {
          deletedAt: Not(IsNull()),
        },
      });

      this.logger.log(`Found ${meals.length} soft-deleted meals`);
      return meals;
    } catch (err) {
      return handleError(err, [], 'Failed to find soft-deleted meals', () => {
        this.logger.logError(err, 'MealsService.findAllSoftDeleted', {});
      });
    }
  }

  /**
   * Find meals by active status
   * @param isActive Active status to filter by
   * @returns Array of meals with the specified active status
   */
  async findByActiveStatus(isActive: boolean): Promise<Meal[]> {
    try {
      const meals = await this.mealsRepository.find({
        where: { isActive },
        relations: ['items', 'category'],
      });

      this.logger.log(`Found ${meals.length} meals with isActive=${isActive}`);
      return meals;
    } catch (err) {
      return handleError(
        err,
        [],
        `Failed to find meals with isActive=${isActive}`,
        () => {
          this.logger.logError(err, 'MealsService.findByActiveStatus', {
            isActive,
          });
        },
      );
    }
  }

  /**
   * Permanently delete a meal (hard delete)
   *
   * @param id Meal ID
   */
  async hardDelete(id: number): Promise<void> {
    try {
      // Check if meal exists (including soft-deleted ones)
      const meal = await this.mealsRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!meal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      // Permanently delete the meal
      await this.mealsRepository.delete(id);
    } catch (err) {
      handleError(
        err,
        [NotFoundException],
        `Failed to permanently delete meal with ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.hardDelete', { id });
        },
      );
    }
  }
}
