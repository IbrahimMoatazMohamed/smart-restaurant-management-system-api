import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
  Scope,
} from '@nestjs/common';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { CreateItemIngredientDto } from './dto/create-item-ingredient.dto';
import { UpdateItemIngredientDto } from './dto/update-item-ingredient.dto';
import { ItemIngredient } from './entities/item-ingredient.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { ItemIngredientResponseDto } from './dto/item-ingredients-response.dto';
import { ItemsService } from '../items/items.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { validateEntityExists } from '../../utils/entity-validation.util';
import { handleError } from '../../utils/error-handler.util';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';

@Injectable({
  scope: Scope.REQUEST,
})
export class ItemIngredientsService {
  private itemIngredientsRepoPromise: Promise<Repository<ItemIngredient>>;

  constructor(
    private readonly tenantRepoProvider: TenantRepositoryProvider,
    @Inject(forwardRef(() => ItemsService))
    private readonly itemsService: ItemsService,
    private readonly ingredientsService: IngredientsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ItemIngredientsService');
    this.itemIngredientsRepoPromise =
      this.tenantRepoProvider.getRepository(ItemIngredient);
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

      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      const itemIngredient = itemIngredientsRepository.create(
        createItemIngredientDto,
      );
      const savedItemIngredient =
        await itemIngredientsRepository.save(itemIngredient);
      return this.findOne(savedItemIngredient.id);
    } catch (error) {
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
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      console.log(itemIngredientsRepository);
      const itemIngredients = await itemIngredientsRepository.find();
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
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      const itemIngredient = await itemIngredientsRepository.findOne({
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
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      return await itemIngredientsRepository.find(options);
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

      if (updateItemIngredientDto.itemId !== undefined) {
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

      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      await itemIngredientsRepository.save(itemIngredient);
      return this.findOne(id);
    } catch (error) {
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
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      await itemIngredientsRepository.delete(id);
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
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      const result = await itemIngredientsRepository.delete({
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
      const itemIds = new Set<number>();
      const ingredientIds = new Set<number>();

      for (const itemIngredient of itemIngredients) {
        if (itemIngredient.item_id) {
          itemIds.add(itemIngredient.item_id);
        }
        if (itemIngredient.ingredient_id) {
          ingredientIds.add(itemIngredient.ingredient_id);
        }
      }

      for (const itemId of itemIds) {
        await validateEntityExists(itemId, this.itemsService, 'Item');
      }
      for (const ingredientId of ingredientIds) {
        await validateEntityExists(
          ingredientId,
          this.ingredientsService,
          'Ingredient',
        );
      }

      const existingCombinations = new Map<string, boolean>();
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      for (const itemIngredient of itemIngredients) {
        if (itemIngredient.item_id && itemIngredient.ingredient_id) {
          const key = `${itemIngredient.item_id}-${itemIngredient.ingredient_id}`;
          const existingRelation = await itemIngredientsRepository.findOne({
            where: {
              item_id: itemIngredient.item_id,
              ingredient_id: itemIngredient.ingredient_id,
            },
          });

          if (existingRelation) {
            throw new ConflictException(
              `Relation between item ID ${itemIngredient.item_id} and ingredient ID ${itemIngredient.ingredient_id} already exists`,
            );
          }

          if (existingCombinations.has(key)) {
            throw new ConflictException(
              `Duplicate item-ingredient combination in batch: Item ID ${itemIngredient.item_id} and Ingredient ID ${itemIngredient.ingredient_id}`,
            );
          }

          existingCombinations.set(key, true);
        }
      }

      const savedIngredients =
        await itemIngredientsRepository.save(itemIngredients);
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
    try {
      // First find existing records to determine which ones to update vs insert
      const itemIds = [
        ...new Set(
          itemIngredients
            .map((item) => item.item_id)
            .filter((id): id is number => id !== undefined),
        ),
      ];
      const ingredientIds = [
        ...new Set(
          itemIngredients
            .map((item) => item.ingredient_id)
            .filter((id): id is number => id !== undefined),
        ),
      ];

      // Validate that all items and ingredients exist
      for (const itemId of itemIds) {
        await validateEntityExists(itemId, this.itemsService, 'Item');
      }

      for (const ingredientId of ingredientIds) {
        await validateEntityExists(
          ingredientId,
          this.ingredientsService,
          'Ingredient',
        );
      }

      // Find existing item-ingredient relationships
      const existingIngredientsRepository =
        await this.itemIngredientsRepoPromise;
      const existingIngredients = await existingIngredientsRepository.find({
        where: itemIngredients.map((item) => ({
          item_id: item.item_id,
          ingredient_id: item.ingredient_id,
        })),
      });

      // Create a map for quick lookup of existing ingredients
      const existingMap = new Map<string, ItemIngredient>();
      existingIngredients.forEach((ingredient) => {
        const key = `${ingredient.item_id}-${ingredient.ingredient_id}`;
        existingMap.set(key, ingredient);
      });

      // Separate ingredients into those to update and those to insert
      const toUpdate: ItemIngredient[] = [];
      const toInsert: Partial<ItemIngredient>[] = [];

      itemIngredients.forEach((ingredient) => {
        if (
          ingredient.item_id === undefined ||
          ingredient.ingredient_id === undefined
        ) {
          return; // Skip ingredients with missing IDs
        }

        const key = `${ingredient.item_id}-${ingredient.ingredient_id}`;
        const existing = existingMap.get(key);

        if (existing) {
          toUpdate.push({
            ...existing,
            qty: ingredient.qty ?? existing.qty,
            measurement: ingredient.measurement ?? existing.measurement,
          });
        } else {
          toInsert.push(ingredient);
        }
      });
      const results: ItemIngredient[] = [];
      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      if (toUpdate.length > 0) {
        const updated = await itemIngredientsRepository.save(toUpdate);
        results.push(...updated);
      }

      if (toInsert.length > 0) {
        const inserted = await itemIngredientsRepository.save(toInsert);
        results.push(...inserted);
      }

      this.logger.log(
        `Upserted ${itemIngredients.length} item ingredients (${toUpdate.length} updated, ${toInsert.length} inserted)`,
      );
      return results;
    } catch (error) {
      this.logger.logError(error, 'ItemIngredientsService.upsert', {
        itemIngredients,
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
      await validateEntityExists(itemId, this.itemsService, 'Item');

      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      const itemIngredients = await itemIngredientsRepository.find({
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
      await validateEntityExists(
        ingredientId,
        this.ingredientsService,
        'Ingredient',
      );

      const itemIngredientsRepository = await this.itemIngredientsRepoPromise;
      const itemIngredients = await itemIngredientsRepository.find({
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
