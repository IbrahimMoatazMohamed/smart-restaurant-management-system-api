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
import { ItemsService } from '../items/items.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
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
   * Find one meal by ID with its items and meal items
   *
   * @param id Meal ID
   * @returns The found meal with its items and meal items
   */
  async findOneWithItems(id: number) {
    try {
      const meal = await this.findOne(id);

      // Get meal items with their quantities
      const mealItems = await this.mealItemsService.findByMealId(id);
      meal.mealItems = mealItems;

      // Get the related items
      if (mealItems && mealItems.length > 0) {
        const itemIds = mealItems.map((item) => item.itemId);
        const items = await this.itemsService.findAll();
        const filteredItems = items.filter((item) => itemIds.includes(item.id));
        meal.items = filteredItems;
      } else {
        meal.items = [];
      }

      return meal;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException],
        `Failed to retrieve meal with items for ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.findOneWithItems', { id });
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
      const existingMeal = await this.findOne(id);

      if (updateMealDto.name && updateMealDto.name !== existingMeal.name) {
        await this.checkMealNameExists(updateMealDto.name, id);
      }

      if (updateMealDto.categoryId) {
        await validateEntityExists(
          updateMealDto.categoryId,
          this.menuCategoriesService,
          'Category',
        );
      }

      const { mealItems, ...restOfDto } = updateMealDto;
      await this.mealsRepository.update(id, restOfDto);

      if (mealItems && mealItems.length > 0) {
        const existingMealItems = await this.mealItemsService.findByMealId(id);
        const existingMealItemsMap = new Map(
          existingMealItems.map((item) => [item.itemId, item]),
        );

        const processedMealItems = mealItems
          .map((item) => {
            if (typeof item === 'string') {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return JSON.parse(item);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                this.logger.warn(
                  `Failed to parse meal item during update: ${String(item)}`,
                );
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
          this.logger.warn(
            `No valid meal items found after processing for meal ID ${id}`,
          );
        } else {
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
            mealId: id,
            itemId: mealItem.itemId,
            quantity: mealItem.quantity,
          }));

          // Create a set of all item IDs in the updated meal items for efficient lookup
          const updatedItemIds = new Set(
            mealItemEntities.map((item) => item.itemId),
          );

          // Delete items that exist in the database but are not in the updated list
          for (const [itemId] of existingMealItemsMap) {
            if (!updatedItemIds.has(itemId)) {
              try {
                await this.mealItemsService.remove(id, itemId);
                this.logger.debug(
                  `Deleted meal item for meal ID ${id}, item ID ${itemId}`,
                );
              } catch (error) {
                this.logger.error(
                  `Failed to delete meal item during update: meal ID ${id}, item ID ${itemId}`,
                  error instanceof Error ? error.message : String(error),
                );
              }
            }
          }

          // Process the updated and new meal items
          for (const mealItem of mealItemEntities) {
            try {
              if (existingMealItemsMap.has(mealItem.itemId)) {
                await this.mealItemsService.update(id, mealItem.itemId, {
                  quantity: mealItem.quantity,
                });
                this.logger.debug(
                  `Updated meal item for meal ID ${id}, item ID ${mealItem.itemId}, quantity: ${mealItem.quantity}`,
                );
              } else {
                await this.mealItemsService.create(mealItem);
                this.logger.debug(
                  `Created meal item for meal ID ${id}: ${JSON.stringify(mealItem)}`,
                );
              }
            } catch (error) {
              this.logger.error(
                `Failed to create/update meal item during update: ${JSON.stringify(mealItem)}`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }
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
        relations: ['category'],
      });

      if (!deletedMeal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      if (!deletedMeal.deletedAt) {
        throw new BadRequestException(`Meal with ID ${id} is not deleted`);
      }

      if (deletedMeal.category && deletedMeal.category.deletedAt) {
        this.logger.warn(
          `Cannot restore meal with ID ${id} because its category is deleted`,
        );
        throw new BadRequestException(
          `Cannot restore meal because its category is deleted. Please restore the category first.`,
        );
      }

      await this.mealsRepository.restore(id);

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
   * Find meals by deleted status
   * @param isDeleted Whether to fetch deleted or active meals
   * @returns Array of meals with the specified deleted status
   */
  async findByDeletedStatus(isDeleted: boolean): Promise<Meal[]> {
    try {
      const meals = await this.mealsRepository.find({
        withDeleted: true,
        where: {
          deletedAt: isDeleted ? Not(IsNull()) : IsNull(),
        },
        relations: ['items', 'category'],
      });

      this.logger.log(
        `Found ${meals.length} meals with isDeleted=${isDeleted}`,
      );
      return meals;
    } catch (err) {
      return handleError(
        err,
        [],
        `Failed to find meals with isDeleted=${isDeleted}`,
        () => {
          this.logger.logError(err, 'MealsService.findByDeletedStatus', {
            isDeleted,
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

  /**
   * Process an order for a meal - decreases ingredient quantities for all items in the meal
   *
   * @param mealId Meal ID that was ordered
   * @param quantity Quantity of the meal ordered
   * @returns Object with success status and any warnings about low ingredient stock
   */
  async processOrder(
    mealId: number,
    quantity: number = 1,
  ): Promise<{
    success: boolean;
    lowStockIngredients: {
      id: number;
      name: string;
      stock: number;
      warningAt: number;
    }[];
  }> {
    try {
      this.logger.log(
        `Processing order for meal ID: ${mealId}, quantity: ${quantity}`,
      );

      const meal = await this.findOneWithItems(mealId);

      if (!meal) {
        throw new NotFoundException(`Meal with ID ${mealId} not found`);
      }

      const mealItems = await this.mealItemsService.findByMealId(mealId);

      if (!mealItems || mealItems.length === 0) {
        this.logger.log(`Meal ID ${mealId} has no items to process`);
        return { success: true, lowStockIngredients: [] };
      }

      const lowStockIngredients: {
        id: number;
        name: string;
        stock: number;
        warningAt: number;
      }[] = [];

      for (const mealItem of mealItems) {
        const itemQuantity = mealItem.quantity * quantity;

        try {
          const result = await this.itemsService.processOrder(
            mealItem.itemId,
            itemQuantity,
          );

          if (
            result.lowStockIngredients &&
            result.lowStockIngredients.length > 0
          ) {
            result.lowStockIngredients.forEach((ingredient) => {
              if (
                !lowStockIngredients.some((item) => item.id === ingredient.id)
              ) {
                lowStockIngredients.push(ingredient);
              }
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to process order for item ID: ${mealItem.itemId} in meal ID: ${mealId}`,
            (error as Error).message,
          );
        }
      }

      return {
        success: true,
        lowStockIngredients,
      };
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        `Failed to process order for meal ID ${mealId}`,
        () => {
          this.logger.logError(error, 'MealsService.processOrder', {
            mealId,
            quantity,
          });
        },
      ) as {
        success: boolean;
        lowStockIngredients: {
          id: number;
          name: string;
          stock: number;
          warningAt: number;
        }[];
      };
    }
  }
}
