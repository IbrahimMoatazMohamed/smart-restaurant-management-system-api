import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Item, ItemStatus } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { MenuCategoriesService } from '../menu-categories/menu-categories.service';
import { ItemIngredientsService } from '../item-ingredients/item-ingredients.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    @Inject(forwardRef(() => ItemIngredientsService))
    private readonly itemIngredientsService: ItemIngredientsService,
    private readonly menuCategoriesService: MenuCategoriesService,
    private readonly ingredientsService: IngredientsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ItemsService');
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
      const item = this.itemsRepository.create(createItemDto);
      const savedItem = await this.itemsRepository.save(item);

      // Create and save item ingredients
      if (createItemDto.ingredients && createItemDto.ingredients.length > 0) {
        const itemIngredients = createItemDto.ingredients.map((ingredient) => ({
          item_id: savedItem.id,
          ingredient_id: ingredient.ingredientId,
          qty: ingredient.qty,
          measurement: ingredient.measurement,
        }));

        await this.itemIngredientsService.upsert(itemIngredients);
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
      const items = await this.itemsRepository.find({
        withDeleted: includeDeleted,
        relations: ['category'],
      });
      this.logger.log(
        `Found ${items.length} items${includeDeleted ? ' including deleted' : ''}`,
      );
      return items;
    } catch (error) {
      return handleError(error, [], 'Failed to retrieve items', () =>
        this.logger.logError(error, 'ItemsService.findAll', { includeDeleted }),
      );
    }
  }

  /**
   * Find a specific item by ID
   * @param id Item ID
   * @returns The found item
   */
  async findOne(id: number) {
    try {
      const item = await this.itemsRepository.findOne({
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

      await this.itemsRepository.save(item);

      if (updateItemDto.ingredients !== undefined) {
        const existingIngredients = await this.itemIngredientsService.find({
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
          await this.itemIngredientsService.delete(ingredientsToRemove);
          this.logger.log(
            `Removed ${ingredientsToRemove.length} ingredients from item ID: ${id}`,
          );
        }

        if (newIngredients.length > 0) {
          await this.itemIngredientsService.upsert(newIngredients);
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
      const items = await this.itemsRepository.find({
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
    try {
      // Validate that id is a valid number
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid item ID: ${id}`);
        throw new BadRequestException(`Invalid item ID: ${id}`);
      }

      this.logger.log(`Restoring soft-deleted item with ID: ${id}`);

      const deletedItem = await this.itemsRepository.findOne({
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

      await this.itemsRepository.restore(id);

      const item = await this.findOne(id);

      await this.itemsRepository.save(item);
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

      const items = await this.itemsRepository.find({
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
      const items = await this.itemsRepository.find({
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

      await this.itemsRepository.softDelete(id);

      this.logger.log(`Item with ID ${id} soft deleted`);

      const softDeletedItem = await this.itemsRepository.findOne({
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
}
