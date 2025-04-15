import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { CreateItemIngredientDto } from './dto/create-item-ingredient.dto';
import { UpdateItemIngredientDto } from './dto/update-item-ingredient.dto';
import { ItemIngredient } from './entities/item-ingredient.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { ItemIngredientResponseDto } from './dto/item-ingredients-response.dto';
import { ItemsService } from '../items/items.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { validateEntityExists } from '../../utils/entity-validation.util';
import { handleError } from 'src/utils/error-handler.util';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';

@Injectable()
export class ItemIngredientsService {
  constructor(
    @InjectRepository(ItemIngredient)
    private readonly itemIngredientsRepository: Repository<ItemIngredient>,
    private readonly itemsService: ItemsService,
    private readonly ingredientsService: IngredientsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ItemIngredientsService');
  }

  /**
   * Create a new item ingredient
   * @param createItemIngredientDto Item ingredient creation data
   * @returns The created item ingredient
   */
  async create(
    createItemIngredientDto: CreateItemIngredientDto,
  ): Promise<ItemIngredientResponseDto> {
    try {
      this.logger.log(
        `Creating item ingredient: Item ID ${createItemIngredientDto.itemId}, Ingredient ID ${createItemIngredientDto.ingredientId}`,
      );

      // Validate that both the item and ingredient exist
      await validateEntityExists(
        createItemIngredientDto.itemId,
        this.itemsService,
        'Item',
      );
      await validateEntityExists(
        createItemIngredientDto.ingredientId,
        this.ingredientsService,
        'Ingredient',
      );

      const itemIngredient = this.itemIngredientsRepository.create(
        createItemIngredientDto,
      );
      const savedItemIngredient =
        await this.itemIngredientsRepository.save(itemIngredient);
      return this.findOne(savedItemIngredient.id);
    } catch (error) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        error,
        `Item ingredient with Item ID ${createItemIngredientDto.itemId} and Ingredient ID ${createItemIngredientDto.ingredientId} already exists`,
        () =>
          this.logger.warn(
            `Attempt to create duplicate item ingredient: Item ID ${createItemIngredientDto.itemId}, Ingredient ID ${createItemIngredientDto.ingredientId}`,
            'ItemIngredientsService.create',
          ),
      );

      return handleError(
        error,
        [NotFoundException, ConflictException],
        'Failed to create item ingredient',
        () =>
          this.logger.logError(error, 'ItemIngredientsService.create', {
            createItemIngredientDto,
          }),
      );
    }
  }

  /**
   * Find all item ingredients
   * @returns Array of item ingredients
   */
  async findAll(): Promise<ItemIngredientResponseDto[]> {
    try {
      const itemIngredients = await this.itemIngredientsRepository.find();
      this.logger.log(`Found ${itemIngredients.length} item ingredients`);
      return itemIngredients;
    } catch (error) {
      this.logger.logError(error, 'ItemIngredientsService.findAll');
      throw new InternalServerErrorException(
        'Failed to retrieve item ingredients',
      );
    }
  }

  /**
   * Find a specific item ingredient by ID
   * @param id Item ingredient ID
   * @returns The found item ingredient
   */
  async findOne(id: number): Promise<ItemIngredientResponseDto> {
    try {
      const itemIngredient = await this.itemIngredientsRepository.findOne({
        where: { id },
      });
      if (!itemIngredient) {
        this.logger.warn(`Item ingredient with ID ${id} not found`);
        throw new NotFoundException(`Item ingredient with ID ${id} not found`);
      }
      return itemIngredient;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        'Failed to retrieve item ingredient',
        () =>
          this.logger.logError(error, 'ItemIngredientsService.findOne', { id }),
      );
    }
  }

  /**
   * Find item ingredients by custom query
   * @param options Query options
   * @returns Array of item ingredients matching the query
   */
  async find(options: {
    where:
      | FindOptionsWhere<ItemIngredient>
      | FindOptionsWhere<ItemIngredient>[];
  }): Promise<ItemIngredientResponseDto[]> {
    try {
      return await this.itemIngredientsRepository.find(options);
    } catch (error) {
      this.logger.logError(error, 'ItemIngredientsService.find', { options });
      throw new InternalServerErrorException('Failed to find item ingredients');
    }
  }

  /**
   * Update an existing item ingredient
   * @param id Item ingredient ID
   * @param updateItemIngredientDto Item ingredient update data
   * @returns The updated item ingredient
   */
  async update(
    id: number,
    updateItemIngredientDto: UpdateItemIngredientDto,
  ): Promise<ItemIngredientResponseDto> {
    try {
      this.logger.log(`Updating item ingredient with ID ${id}`);

      const itemIngredient = await this.findOne(id);

      // Map DTO fields to entity fields
      if (updateItemIngredientDto.itemId !== undefined) {
        // Validate that the item exists using ItemsService
        await validateEntityExists(
          updateItemIngredientDto.itemId,
          this.itemsService,
          'Item',
        );
        itemIngredient.item_id = updateItemIngredientDto.itemId;
      }

      if (updateItemIngredientDto.ingredientId !== undefined) {
        await validateEntityExists(
          updateItemIngredientDto.ingredientId,
          this.ingredientsService,
          'Ingredient',
        );
        itemIngredient.ingredient_id = updateItemIngredientDto.ingredientId;
      }

      if (updateItemIngredientDto.qty !== undefined) {
        itemIngredient.qty = updateItemIngredientDto.qty;
      }

      if (updateItemIngredientDto.measurement !== undefined) {
        itemIngredient.measurement = updateItemIngredientDto.measurement;
      }
      this.logger.log(`Item ingredient with ID ${id} updated`);

      await this.itemIngredientsRepository.save(itemIngredient);
      return this.findOne(id);
    } catch (error) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        error,
        `Item ingredient with Item ID ${updateItemIngredientDto.itemId} and Ingredient ID ${updateItemIngredientDto.ingredientId} already exists`,
        () =>
          this.logger.warn(
            `Attempt to update to duplicate item ingredient: Item ID ${updateItemIngredientDto.itemId}, Ingredient ID ${updateItemIngredientDto.ingredientId}`,
            'ItemIngredientsService.update',
          ),
      );

      return handleError(
        error,
        [NotFoundException, BadRequestException],
        `Failed to update item ingredient with ID ${id}`,
        () =>
          this.logger.logError(error, 'ItemIngredientsService.update', { id }),
      );
    }
  }

  /**
   * Remove an item ingredient
   * @param id Item ingredient ID
   * @returns Void
   */
  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);
      await this.itemIngredientsRepository.delete(id);
      this.logger.log(`Item ingredient with ID ${id} removed`);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to remove item ingredient with ID ${id}`,
        () =>
          this.logger.logError(error, 'ItemIngredientsService.remove', { id }),
      );
    }
  }

  /**
   * Delete multiple item ingredients by IDs
   * @param ids Array of item ingredient IDs
   * @returns Void
   */
  async delete(ids: number[]): Promise<void> {
    try {
      const result = await this.itemIngredientsRepository.delete({
        id: In(ids),
      });
      this.logger.log(`Deleted ${result.affected} item ingredients`);
    } catch (error) {
      this.logger.logError(error, 'ItemIngredientsService.delete', { ids });
      throw new InternalServerErrorException(
        'Failed to delete item ingredients',
      );
    }
  }

  /**
   * Save multiple item ingredients
   * @param itemIngredients Array of item ingredients to save
   * @returns The saved item ingredients
   */
  async save(
    itemIngredients: Partial<ItemIngredient>[],
  ): Promise<ItemIngredient[]> {
    try {
      // Validate all items and ingredients exist before saving
      const itemIds = new Set<number>();
      const ingredientIds = new Set<number>();

      // Collect all unique item and ingredient IDs
      for (const itemIngredient of itemIngredients) {
        if (itemIngredient.item_id) {
          itemIds.add(itemIngredient.item_id);
        }
        if (itemIngredient.ingredient_id) {
          ingredientIds.add(itemIngredient.ingredient_id);
        }
      }

      // Validate all items exist
      for (const itemId of itemIds) {
        await validateEntityExists(itemId, this.itemsService, 'Item');
      }

      // Validate all ingredients exist
      for (const ingredientId of ingredientIds) {
        await validateEntityExists(
          ingredientId,
          this.ingredientsService,
          'Ingredient',
        );
      }

      // Check for duplicate item-ingredient combinations
      const existingCombinations = new Map<string, boolean>();
      for (const itemIngredient of itemIngredients) {
        if (itemIngredient.item_id && itemIngredient.ingredient_id) {
          const key = `${itemIngredient.item_id}-${itemIngredient.ingredient_id}`;

          // Check if this combination already exists in the database
          const existingRelation = await this.itemIngredientsRepository.findOne(
            {
              where: {
                item_id: itemIngredient.item_id,
                ingredient_id: itemIngredient.ingredient_id,
              },
            },
          );

          // Skip validation for existing records being updated (they have an ID)
          if (existingRelation) {
            throw new ConflictException(
              `Relation between item ID ${itemIngredient.item_id} and ingredient ID ${itemIngredient.ingredient_id} already exists`,
            );
          }

          // Check for duplicates within the current batch
          if (existingCombinations.has(key)) {
            throw new ConflictException(
              `Duplicate item-ingredient combination in batch: Item ID ${itemIngredient.item_id} and Ingredient ID ${itemIngredient.ingredient_id}`,
            );
          }

          existingCombinations.set(key, true);
        }
      }

      const savedIngredients =
        await this.itemIngredientsRepository.save(itemIngredients);
      this.logger.log(`Saved ${savedIngredients.length} item ingredients`);
      return savedIngredients;
    } catch (error) {
      return handleError(
        error,
        [ConflictException, NotFoundException],
        'Failed to save item ingredients',
        () =>
          this.logger.logError(error, 'ItemIngredientsService.save', {
            itemIngredients,
          }),
      );
    }
  }

  /**
   * Upsert (insert or update) item ingredients
   * @param itemIngredients Array of item ingredients to upsert
   * @returns The upserted item ingredients
   */
  async upsert(
    itemIngredients: Partial<ItemIngredient>[],
  ): Promise<ItemIngredient[]> {
    const conflictPaths = ['item_id', 'ingredient_id'];
    try {
      const result = await this.itemIngredientsRepository.upsert(
        itemIngredients,
        { conflictPaths },
      );
      this.logger.log(`Upserted ${itemIngredients.length} item ingredients`);
      return result.raw as ItemIngredient[];
    } catch (error) {
      this.logger.logError(error, 'ItemIngredientsService.upsert', {
        itemIngredients,
        conflictPaths,
      });
      throw new InternalServerErrorException(
        'Failed to upsert item ingredients',
      );
    }
  }

  /**
   * Find item ingredients by item ID
   * @param itemId Item ID
   * @returns Array of item ingredients for the specified item
   */
  async findByItemId(itemId: number): Promise<ItemIngredient[]> {
    try {
      // Validate that the item exists using ItemsService
      await validateEntityExists(itemId, this.itemsService, 'Item');

      const itemIngredients = await this.itemIngredientsRepository.find({
        where: { item_id: itemId },
        relations: ['ingredient'],
      });
      this.logger.log(
        `Found ${itemIngredients.length} ingredients for item ID ${itemId}`,
      );
      return itemIngredients;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to retrieve ingredients for item ID ${itemId}`,
        () =>
          this.logger.logError(error, 'ItemIngredientsService.findByItemId', {
            itemId,
          }),
      );
    }
  }

  /**
   * Find item ingredients by ingredient ID
   * @param ingredientId Ingredient ID
   * @returns Array of item ingredients using the specified ingredient
   */
  async findByIngredientId(ingredientId: number): Promise<ItemIngredient[]> {
    try {
      // Validate that the ingredient exists using IngredientsService
      await validateEntityExists(
        ingredientId,
        this.ingredientsService,
        'Ingredient',
      );

      const itemIngredients = await this.itemIngredientsRepository.find({
        where: { ingredient_id: ingredientId },
        relations: ['item'],
      });
      this.logger.log(
        `Found ${itemIngredients.length} items using ingredient ID ${ingredientId}`,
      );
      return itemIngredients;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to retrieve items using ingredient ID ${ingredientId}`,

        () =>
          this.logger.logError(
            error,
            'ItemIngredientsService.findByIngredientId',
            {
              ingredientId,
            },
          ),
      );
    }
  }
}
