import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { Repository, Not, IsNull } from 'typeorm';
import { Item, ItemStatus } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { ItemIngredient } from '../item-ingredients/entities/item-ingredient.entity';
import { IngredientsService } from '../ingredients/ingredients.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';
import { UpdateQuantityDto } from '../ingredients/dto/update-quantity.dto';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

@Injectable({ scope: Scope.REQUEST })
export class ItemsService {
  private readonly itemsRepoPromise: Promise<Repository<Item>>;
  private readonly itemIngredientsRepoPromise: Promise<
    Repository<ItemIngredient>
  >;

  constructor(
    private readonly tenantRepoProvider: TenantRepositoryProvider,
    private readonly logger: CustomLoggerService,
    private readonly menuCategoriesService: MenuCategoriesService,
    private readonly ingredientsService: IngredientsService,
  ) {
    this.logger.setContext('ItemsService');
    this.itemsRepoPromise = this.tenantRepoProvider.getRepository(Item);
    this.itemIngredientsRepoPromise =
      this.tenantRepoProvider.getRepository(ItemIngredient);
  }

  /**
   * Create a new item
   * @param createItemDto Item creation data
   * @returns The created item
   */
  async create(createItemDto: CreateItemDto) {
    try {
      // Verify that the category exists
      await validateEntityExists(
        createItemDto.categoryId,
        this.menuCategoriesService,
        'MenuCategory',
      );

      // Validate all ingredients exist if provided
      if (
        Array.isArray(createItemDto.ingredients) &&
        createItemDto.ingredients.length > 0
      ) {
        for (const ingredient of createItemDto.ingredients) {
          await validateEntityExists(
            ingredient.ingredientId,
            this.ingredientsService,
            'Ingredient',
          );
        }
      }

      // Create and save the item
      const itemsRepository = await this.itemsRepoPromise;
      const item = itemsRepository.create(createItemDto);
      const savedItem = await itemsRepository.save(item);

      // Create and save item ingredients
      if (createItemDto.ingredients && createItemDto.ingredients.length > 0) {
        const itemIngredients = createItemDto.ingredients.map((ingredient) => ({
          item_id: savedItem.id,
          ingredient_id: ingredient.ingredientId,
          qty: ingredient.qty,
          measurement: ingredient.measurement,
        }));

        const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
        await itemIngredientsRepository.save(itemIngredients);
        this.logger.log(
          `Added ${itemIngredients.length} ingredients to item ID: ${savedItem.id}`,
        );
      }

      this.logger.log(`Item created with ID: ${savedItem.id}`);
      return this.findOne(savedItem.id); // Return the item
    } catch (error) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        error,
        `Item with name '${createItemDto.name}' already exists`,
        () =>
          this.logger.warn(
            `Attempt to create duplicate item: ${createItemDto.name}`,
            'ItemsService.create',
          ),
      );

      return handleError(
        error,
        [NotFoundException, BadRequestException],
        'Failed to create item',
        () =>
          this.logger.logError(error, 'ItemsService.create', { createItemDto }),
      );
    }
  }

  /**
   * Find all items
   * @returns Array of items
   */
  async findAll(includeDeleted: boolean = false) {
    try {
      const itemsRepository = await this.itemsRepoPromise;
      const items = await itemsRepository.find({
        withDeleted: includeDeleted,
        relations: ['category'],
      });

      this.logger.log(
        `Found ${items.length} items${includeDeleted ? ' including deleted' : ''}`,
      );
      return items;
    } catch (error) {
      return handleError(error, [], 'Failed to retrieve items', () => {
        this.logger.logError(error, 'ItemsService.findAll', {
          includeDeleted,
        });
      });
    }
  }

  /**
   * Find a specific item by ID
   * @param id Item ID
   * @returns The found item
   */
  async findOne(id: number) {
    try {
      const itemsRepository = await this.itemsRepoPromise;
      const item = await itemsRepository.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!item) {
        this.logger.warn(`Item with ID ${id} not found`);
        throw new NotFoundException(`Item with ID ${id} not found`);
      }

      this.logger.log(`Found item with ID: ${id}`);
      return item;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to retrieve item with ID ${id}`,
        () => this.logger.logError(error, 'ItemsService.findOne', { id }),
      );
    }
  }

  /**
   * Update an existing item
   * @param id Item ID
   * @param updateItemDto Item update data
   * @returns The updated item
   */
  async update(id: number, updateItemDto: UpdateItemDto) {
    try {
      const item = await this.findOne(id);

      if (updateItemDto.categoryId) {
        await validateEntityExists(
          updateItemDto.categoryId,
          this.menuCategoriesService,
          'MenuCategory',
        );
      }

      if (updateItemDto.ingredients?.length) {
        for (const ingredient of updateItemDto.ingredients) {
          await validateEntityExists(
            ingredient.ingredientId,
            this.ingredientsService,
            'Ingredient',
          );
        }
      }

      if (updateItemDto.name) item.name = updateItemDto.name;
      if (updateItemDto.price !== undefined) item.price = updateItemDto.price;
      if (updateItemDto.photo) item.photo = updateItemDto.photo;
      if (updateItemDto.status) item.status = updateItemDto.status;
      if (updateItemDto.categoryId) item.categoryId = updateItemDto.categoryId;
      if (updateItemDto.description !== undefined) {
        item.description = updateItemDto.description || '';
      }

      const itemsRepository = await this.itemsRepoPromise;
      await itemsRepository.save(item);

      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;

      if (updateItemDto.ingredients !== undefined) {
        const existingIngredients = await itemIngredientsRepository.find({
          where: { item_id: id },
        });

        const newIngredients = (updateItemDto.ingredients || []).map(
          (ingredient) => ({
            item_id: id,
            ingredient_id: ingredient.ingredientId,
            qty: ingredient.qty,
            measurement: ingredient.measurement,
          }),
        );

        const newIngredientIds = newIngredients.map((i) => i.ingredient_id);
        const ingredientsToRemove = existingIngredients
          .filter((i) => !newIngredientIds.includes(i.ingredient_id))
          .map((i) => i.id);

        if (ingredientsToRemove.length) {
          await itemIngredientsRepository.delete(ingredientsToRemove);
          this.logger.log(
            `Removed ${ingredientsToRemove.length} ingredients from item ID: ${id}`,
          );
        }

        if (newIngredients.length > 0) {
          await itemIngredientsRepository.save(newIngredients);
          this.logger.log(
            `Updated ${newIngredients.length} ingredients for item ID: ${id}`,
          );
        }
      }

      this.logger.log(`Item with ID ${id} updated`);
      return this.findOne(id);
    } catch (error) {
      if (updateItemDto.name) {
        handleDuplicateEntryError(
          error,
          `Item with name '${updateItemDto.name}' already exists`,
          () =>
            this.logger.warn(
              `Attempt to update to duplicate item name: ${updateItemDto.name}`,
              'ItemsService.update',
            ),
        );
      }

      return handleError(
        error,
        [NotFoundException, BadRequestException, ConflictException],
        `Failed to update item with ID ${id}`,
        () =>
          this.logger.logError(error, 'ItemsService.update', {
            id,
            updateItemDto,
          }),
      );
    }
  }

  /**
   * Find items by status
   * @param status Item status
   * @returns Array of items with the specified status
   */
  async findByStatus(status: string) {
    try {
      const itemsRepository = await this.itemsRepoPromise;
      const items = await itemsRepository.find({
        where: { status: status as ItemStatus },
        relations: ['category'],
      });
      this.logger.log(`Found ${items.length} items with status: ${status}`);
      return items;
    } catch (error) {
      return handleError(
        error,
        [],
        `Failed to retrieve items with status ${status}`,
        () =>
          this.logger.logError(error, 'ItemsService.findByStatus', { status }),
      );
    }
  }

  /**
   * Restore a soft-deleted item
   *
   * @param id Item ID
   * @returns Restored item
   */
  async restore(id: number): Promise<Item> {
    const itemsRepository = await this.itemsRepoPromise;
    try {
      // Validate that id is a valid number
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid item ID: ${id}`);
        throw new BadRequestException(`Invalid item ID: ${id}`);
      }

      this.logger.log(`Restoring soft-deleted item with ID: ${id}`);

      const deletedItem = await itemsRepository.findOne({
        where: { id },
        withDeleted: true,
        relations: ['category'],
      });

      if (!deletedItem) {
        throw new NotFoundException(`Item with ID ${id} not found`);
      }

      if (!deletedItem.deletedAt) {
        throw new BadRequestException(`Item with ID ${id} is not deleted`);
      }

      if (deletedItem.category && deletedItem.category.deletedAt) {
        this.logger.warn(
          `Cannot restore item with ID ${id} because its category is deleted`,
        );
        throw new BadRequestException(
          `Cannot restore item because its category is deleted. Please restore the category first.`,
        );
      }

      await itemsRepository.restore(id);

      const item = await this.findOne(id);

      await itemsRepository.save(item);
      this.logger.log(`Item with ID ${id} restored`);

      return this.findOne(id);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        `Failed to restore item with ID ${id}`,
        () => {
          this.logger.logError(error, 'ItemsService.restore', { id });
        },
      );
    }
  }

  /**
   * Find all soft-deleted items
   *
   * @returns List of soft-deleted items
   */
  async findAllSoftDeleted(): Promise<Item[]> {
    try {
      this.logger.log('Finding all soft-deleted items');

      const itemsRepository = await this.itemsRepoPromise;
      const items = await itemsRepository.find({
        withDeleted: true,
        relations: ['category'],
        where: {
          deletedAt: Not(IsNull()),
        },
      });

      this.logger.log(`Found ${items.length} soft-deleted items`);
      return items;
    } catch (error) {
      return handleError(error, [], 'Failed to find soft-deleted items', () => {
        this.logger.logError(error, 'ItemsService.findAllSoftDeleted', {});
      });
    }
  }

  /**
   * Find active or deleted items
   * @param deleted Whether to find deleted items
   * @returns Array of active or deleted items
   */
  async findByDeletedStatus(deleted: boolean): Promise<Item[]> {
    try {
      const itemsRepository = await this.itemsRepoPromise;
      const items = await itemsRepository.find({
        withDeleted: true,
        where: deleted ? { deletedAt: Not(IsNull()) } : { deletedAt: IsNull() },
        relations: ['category'],
      });

      this.logger.log(
        `Found ${items.length} ${deleted ? 'deleted' : 'active'} items`,
      );
      return items;
    } catch (error) {
      return handleError(
        error,
        [],
        `Failed to find ${deleted ? 'deleted' : 'active'} items`,
        () => {
          this.logger.logError(error, 'ItemsService.findByDeletedStatus', {
            deleted,
          });
        },
      );
    }
  }

  /**
   * Soft delete an item
   *
   * @param id Item ID
   * @returns The soft-deleted item
   */
  async remove(id: number): Promise<Item | null> {
    try {
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid item ID: ${id}`);
        throw new BadRequestException(`Invalid item ID: ${id}`);
      }

      await this.findOne(id);

      const itemsRepository = await this.itemsRepoPromise;
      await itemsRepository.softDelete(id);

      this.logger.log(`Item with ID ${id} soft deleted`);

      const softDeletedItem = await itemsRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!softDeletedItem) {
        throw new NotFoundException(
          `Item with ID ${id} not found after soft delete`,
        );
      }

      return softDeletedItem;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        `Failed to soft delete item with ID ${id}`,
        () => {
          this.logger.logError(error, 'ItemsService.softDelete', { id });
        },
      );
    }
  }

  /**
   * Process an order for an item - decreases ingredient quantities
   *
   * @param itemId Item ID that was ordered
   * @param quantity Quantity of the item ordered
   * @returns Object with success status and any warnings about low ingredient stock
   */
  async processOrder(
    itemId: number,
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
        `Processing order for item ID: ${itemId}, quantity: ${quantity}`,
      );

      // Validate the item exists
      const item = await this.findOne(itemId);
      if (!item) {
        throw new NotFoundException(`Item with ID ${itemId} not found`);
      }

      // Get all ingredients for this item
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      const itemIngredients = await itemIngredientsRepository.findBy({
        item_id: itemId,
      });
      if (!itemIngredients || itemIngredients.length === 0) {
        this.logger.log(`Item ID ${itemId} has no ingredients to process`);
        return { success: true, lowStockIngredients: [] };
      }

      const lowStockIngredients: {
        id: number;
        name: string;
        stock: number;
        warningAt: number;
      }[] = [];

      // Process each ingredient
      for (const itemIngredient of itemIngredients) {
        if (!itemIngredient.ingredient) {
          this.logger.warn(
            `Missing ingredient relation for item ingredient ID: ${itemIngredient.id}`,
          );
          continue;
        }

        const ingredientId = itemIngredient.ingredient_id;
        const requiredAmount = itemIngredient.qty * quantity;

        // Create DTO with measurement information
        const updateQuantityDto: UpdateQuantityDto = {
          amount: requiredAmount,
          measurement: itemIngredient.measurement,
        };

        try {
          // Decrease the ingredient quantity
          const result = await this.ingredientsService.decreaseQuantity(
            ingredientId,
            updateQuantityDto,
          );

          // Check if the ingredient is below warning threshold
          if (result.belowWarningThreshold) {
            lowStockIngredients.push({
              id: result.ingredient.id,
              name: result.ingredient.name,
              stock: result.ingredient.stock,
              warningAt: result.ingredient.warningAt,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to decrease quantity for ingredient ID: ${ingredientId}`,
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
        `Failed to process order for item ID ${itemId}`,
        () => {
          this.logger.logError(error, 'ItemsService.processOrder', {
            itemId,
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
