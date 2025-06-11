import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
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
import { MealItemsService } from '../meal-items/meal-items.service';

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
    @Inject(forwardRef(() => MealItemsService))
    private readonly mealItemsService: MealItemsService,
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
      await this.checkMealNameExists(createMealDto.name);

      await validateEntityExists(
        createMealDto.categoryId,
        this.menuCategoriesService,
        'Category',
      );

      // Create the meal without items first
      const { mealItems, ...mealData } = createMealDto;
      const meal = this.mealsRepository.create(mealData);
      const savedMeal = await this.mealsRepository.save(meal);

      if (mealItems && mealItems.length > 0) {
        const processedMealItems = mealItems
          .map((item) => {
            if (typeof item === 'string') {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(item);
              } catch {
                this.logger.warn(`Failed to parse meal item: ${String(item)}`);
                return null;
              }
            }
            return item;
          })
          .filter(
            (item): item is { itemId: number; quantity: number } =>
              item !== null &&
              typeof item === 'object' &&
              'itemId' in item &&
              'quantity' in item &&
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              typeof item.itemId === 'number' &&
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              typeof item.quantity === 'number',
          );

        if (processedMealItems.length === 0) {
          this.logger.warn('No valid meal items found after processing');
        } else {
          // Verify all items exist
          await Promise.all(
            processedMealItems.map(async (mealItem) => {
              await validateEntityExists(
                mealItem.itemId,
                this.itemsService,
                'Item',
              );
            }),
          );

          const mealItemEntities = processedMealItems.map((mealItem) => ({
            mealId: savedMeal.id,
            itemId: mealItem.itemId,
            quantity: mealItem.quantity,
          }));

          for (const mealItem of mealItemEntities) {
            try {
              await this.mealItemsService.create(mealItem);
            } catch (error) {
              this.logger.error(
                `Failed to create meal item: ${JSON.stringify(mealItem)}`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }

          const items = await Promise.all(
            processedMealItems.map((mealItem) =>
              this.itemsService.findOne(mealItem.itemId),
            ),
          );
          savedMeal.items = items;
          await this.mealsRepository.save(savedMeal);
        }
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
        relations: ['items', 'category', 'mealItems'],
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

      // Get the meal with relations
      const meal = await this.mealsRepository.findOne({
        where: { id },
        relations: ['items'],
      });

      if (meal) {
        await this.mealsRepository.save(meal);
      }

      return this.findOne(id);
    } catch (err) {
      handleDuplicateEntryError(err, 'Meal name already exists', () => {
        this.logger.error(
          'Database conflict: Meal name already exists',
          JSON.stringify(err),
        );
      });

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
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid meal ID: ${id}`);
        throw new BadRequestException(`Invalid meal ID: ${id}`);
      }

      this.logger.log(`Soft deleting meal with ID: ${id}`);

      await this.findOne(id);

      await this.mealItemsService.softDeleteAllByMealId(id);
      this.logger.log(`All meal items for meal ID ${id} soft deleted`);

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
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid meal ID: ${id}`);
        throw new BadRequestException(`Invalid meal ID: ${id}`);
      }

      this.logger.log(`Restoring soft-deleted meal with ID: ${id}`);

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

      await this.mealsRepository.restore(id);

      const meal = await this.findOne(id);

      meal.isActive = true;
      await this.mealsRepository.save(meal);

      try {
        const mealItems = await this.mealItemsService.findByMealId(id, true);

        for (const mealItem of mealItems) {
          if (mealItem.deletedAt) {
            await this.mealItemsService.restore(
              mealItem.mealId,
              mealItem.itemId,
            );
          }
        }

        this.logger.log(`Associated meal items for meal ID ${id} restored`);
      } catch (mealItemError: unknown) {
        const errorMessage =
          mealItemError instanceof Error
            ? mealItemError.message
            : 'Unknown error';
        this.logger.warn(
          `Meal restored but there was an issue restoring meal items: ${errorMessage}`,
        );
      }

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
      const meal = await this.mealsRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!meal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      try {
        await this.mealItemsService.removeAllByMealId(id);
        this.logger.log(`All meal items for meal ID ${id} hard deleted`);
      } catch (mealItemError: unknown) {
        const errorMessage =
          mealItemError instanceof Error
            ? mealItemError.message
            : 'Unknown error';
        this.logger.warn(
          `There was an issue deleting meal items: ${errorMessage}`,
        );
      }

      await this.mealsRepository.delete(id);
      this.logger.log(`Meal with ID ${id} permanently deleted`);
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
