import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';
import { CreateIngredientCategoryDto } from './dto/create-ingredient-category.dto';
import { UpdateIngredientCategoryDto } from './dto/update-ingredient-category.dto';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';
import { IngredientsService } from '../ingredients/ingredients.service';

@Injectable({
  scope: Scope.REQUEST,
})
export class IngredientCategoriesService {
  private ingredientCategoryRepoPromise: Promise<
    Repository<IngredientCategory>
  >;

  constructor(
    private readonly tenantRepoProvider: TenantRepositoryProvider,
    private readonly ingredientService: IngredientsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('IngredientCategoriesService');
    this.ingredientCategoryRepoPromise =
      this.tenantRepoProvider.getRepository(IngredientCategory);
  }

  /**
   * Create a new ingredient category
   *
   * @param createIngredientCategoryDto Ingredient category creation data
   * @returns Created ingredient category
   */
  async create(
    createIngredientCategoryDto: CreateIngredientCategoryDto,
  ): Promise<IngredientCategory> {
    try {
      this.logger.log(
        `Creating new ingredient category: ${createIngredientCategoryDto.name}`,
      );

      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      const ingredientCategory = ingredientCategoryRepository.create(
        createIngredientCategoryDto,
      );
      const savedCategory =
        await ingredientCategoryRepository.save(ingredientCategory);

      this.logger.log(
        `Ingredient category created with ID: ${savedCategory.id}`,
      );
      return this.findOne(savedCategory.id); // Return the category with relations
    } catch (error) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        error,
        `Ingredient category with name '${createIngredientCategoryDto.name}' already exists`,
        () =>
          this.logger.warn(
            `Attempt to create duplicate ingredient category: ${createIngredientCategoryDto.name}`,
            'IngredientCategoriesService.create',
          ),
      );

      return handleError(
        error,
        [BadRequestException],
        'Failed to create ingredient category',
        () =>
          this.logger.logError(error, 'IngredientCategoriesService.create', {
            createIngredientCategoryDto,
          }),
      );
    }
  }

  /**
   * Get all ingredient categories
   *
   * @param includeDeleted Flag to get soft-deleted categories
   * @returns List of ingredient categories
   */
  async findAll(includeDeleted = false): Promise<IngredientCategory[]> {
    try {
      this.logger.log(
        `Retrieving all ingredient categories, includeDeleted: ${includeDeleted}`,
      );

      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      const queryBuilder = ingredientCategoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.ingredients', 'ingredients')
        .withDeleted();

      // Build where conditions
      const whereConditions: string[] = [];
      const parameters: Record<string, any> = {};

      if (!includeDeleted) {
        whereConditions.push('category.deleted_at IS NULL');
      }

      // Apply where conditions if any exist
      if (whereConditions.length > 0) {
        queryBuilder.where(whereConditions.join(' AND '), parameters);
      }

      const categories = await queryBuilder.getMany();
      this.logger.log(`Found ${categories.length} ingredient categories`);
      return categories;
    } catch (error) {
      return handleError(
        error,
        [],
        'Failed to retrieve ingredient categories',
        () =>
          this.logger.logError(error, 'IngredientCategoriesService.findAll', {
            includeDeleted,
          }),
      );
    }
  }

  /**
   * Get one ingredient category by ID
   *
   * @param id Ingredient category ID
   * @returns Ingredient category
   */
  async findOne(id: number): Promise<IngredientCategory> {
    try {
      // Validate that id is a valid number
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid ingredient category ID: ${id}`);
        throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
      }

      this.logger.log(`Retrieving ingredient category with ID: ${id}`);

      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      const ingredientCategory = await ingredientCategoryRepository.findOne({
        where: { id },
        relations: ['ingredients'],
      });

      if (!ingredientCategory) {
        this.logger.warn(`Ingredient category with ID ${id} not found`);
        throw new NotFoundException(
          `Ingredient category with ID ${id} not found`,
        );
      }

      return ingredientCategory;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to retrieve ingredient category with ID ${id}`,
        () =>
          this.logger.logError(error, 'IngredientCategoriesService.findOne', {
            id,
          }),
      );
    }
  }

  /**
   * Update an ingredient category
   *
   * @param id Ingredient category ID
   * @param updateIngredientCategoryDto Ingredient category update data
   * @returns Updated ingredient category
   */
  async update(
    id: number,
    updateIngredientCategoryDto: UpdateIngredientCategoryDto,
  ): Promise<IngredientCategory> {
    try {
      this.logger.log(`Updating ingredient category with ID: ${id}`);

      // First verify the category exists
      const ingredientCategory = await this.findOne(id);

      // Update properties explicitly instead of using merge
      if (updateIngredientCategoryDto.name !== undefined) {
        ingredientCategory.name = updateIngredientCategoryDto.name;
      }

      if (updateIngredientCategoryDto.description !== undefined) {
        ingredientCategory.description =
          updateIngredientCategoryDto.description;
      }

      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      await ingredientCategoryRepository.save(ingredientCategory);

      this.logger.log(`Ingredient category with ID ${id} updated`);
      return this.findOne(id); // Return the updated category with relations
    } catch (error) {
      // Handle duplicate entry errors if name is being updated
      if (updateIngredientCategoryDto.name) {
        handleDuplicateEntryError(
          error,
          `Ingredient category with name '${updateIngredientCategoryDto.name}' already exists`,
          () =>
            this.logger.warn(
              `Attempt to update to duplicate ingredient category name: ${updateIngredientCategoryDto.name}`,
              'IngredientCategoriesService.update',
            ),
        );
      }

      return handleError(
        error,
        [NotFoundException, BadRequestException, ConflictException],
        `Failed to update ingredient category with ID ${id}`,
        () =>
          this.logger.logError(error, 'IngredientCategoriesService.update', {
            id,
            updateIngredientCategoryDto,
          }),
      );
    }
  }

  /**
   * Soft delete an ingredient category using TypeORM's built-in soft delete
   *
   * @param id Ingredient category ID
   */
  async remove(id: number): Promise<void> {
    try {
      this.logger.log(`Soft deleting ingredient category with ID: ${id}`);

      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      await this.ingredientService.deleteByCategoryId(id);

      await ingredientCategoryRepository.softDelete(id);
      this.logger.log(`Ingredient category with ID ${id} soft deleted`);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to soft delete ingredient category with ID ${id}`,
        () =>
          this.logger.logError(
            error,
            'IngredientCategoriesService.softDelete',
            {
              id,
            },
          ),
      );
    }
  }

  /**
   * Restore a soft-deleted ingredient category
   *
   * @param id Ingredient category ID
   */
  async restore(id: number): Promise<IngredientCategory> {
    try {
      this.logger.log(
        `Restoring soft-deleted ingredient category with ID: ${id}`,
      );

      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      await ingredientCategoryRepository.restore(id);

      this.logger.log(`Ingredient category with ID ${id} restored`);

      return this.findOne(id);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to restore ingredient category with ID ${id}`,
        () =>
          this.logger.logError(error, 'IngredientCategoriesService.restore', {
            id,
          }),
      );
    }
  }

  /**
   * Find all soft-deleted ingredient categories
   *
   * @returns List of soft-deleted ingredient categories
   */
  async findAllSoftDeleted(): Promise<IngredientCategory[]> {
    try {
      this.logger.log('Finding all soft-deleted ingredient categories');

      // Use withDeleted to include soft-deleted entities and filter to only get deleted ones
      const ingredientCategoryRepository =
        await this.ingredientCategoryRepoPromise;
      const categories = await ingredientCategoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.ingredients', 'ingredients')
        .withDeleted()
        .where('category.deleted_at IS NOT NULL')
        .getMany();

      this.logger.log(
        `Found ${categories.length} soft-deleted ingredient categories`,
      );
      return categories;
    } catch (error) {
      return handleError(
        error,
        [],
        'Failed to find soft-deleted ingredient categories',
        () =>
          this.logger.logError(
            error,
            'IngredientCategoriesService.findAllSoftDeleted',
            {},
          ),
      );
    }
  }
}
