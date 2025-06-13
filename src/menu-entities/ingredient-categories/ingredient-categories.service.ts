import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIngredientCategoryDto } from './dto/create-ingredient-category.dto';
import { UpdateIngredientCategoryDto } from './dto/update-ingredient-category.dto';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import { handleError } from '../../utils/error-handler.util';

@Injectable()
export class IngredientCategoriesService {
  constructor(
    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepository: Repository<IngredientCategory>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('IngredientCategoriesService');
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

      const ingredientCategory = this.ingredientCategoryRepository.create(
        createIngredientCategoryDto,
      );
      const savedCategory =
        await this.ingredientCategoryRepository.save(ingredientCategory);

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
   * @param name Filter by ingredient category name
   * @param description Filter by ingredient category description
   * @returns List of ingredient categories
   */
  async findAll(
    includeDeleted = false,
    name?: string,
    description?: string,
  ): Promise<IngredientCategory[]> {
    try {
      this.logger.log(
        `Retrieving all ingredient categories, includeDeleted: ${includeDeleted}, name: ${name}, description: ${description}`,
      );

      const queryBuilder = this.ingredientCategoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.ingredients', 'ingredients')
        .withDeleted();

      // Build where conditions
      const whereConditions: string[] = [];
      const parameters: Record<string, any> = {};

      if (!includeDeleted) {
        whereConditions.push('category.isActive = :isActive');
        parameters['isActive'] = true;
      }

      if (name) {
        whereConditions.push('category.name LIKE :name');
        parameters['name'] = `%${name}%`;
      }

      if (description) {
        whereConditions.push('category.description LIKE :description');
        parameters['description'] = `%${description}%`;
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
            name,
            description,
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

      const ingredientCategory =
        await this.ingredientCategoryRepository.findOne({
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

      if (updateIngredientCategoryDto.isActive !== undefined) {
        ingredientCategory.isActive = updateIngredientCategoryDto.isActive;
      }

      await this.ingredientCategoryRepository.save(ingredientCategory);

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
   * Hard remove an ingredient category
   *
   * @param id Ingredient category ID
   */
  async remove(id: number): Promise<void> {
    try {
      this.logger.log(`Hard removing ingredient category with ID: ${id}`);

      // First verify the category exists
      const ingredientCategory = await this.findOne(id);

      // Check if the category has ingredients
      if (ingredientCategory.ingredients?.length > 0) {
        this.logger.warn(
          `Cannot delete ingredient category ID ${id} as it has ${ingredientCategory.ingredients.length} associated ingredients`,
        );
        throw new ConflictException(
          `Cannot delete ingredient category as it has ${ingredientCategory.ingredients.length} associated ingredients`,
        );
      }

      await this.ingredientCategoryRepository.remove(ingredientCategory);
      this.logger.log(`Ingredient category with ID ${id} hard removed`);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, ConflictException],
        `Failed to remove ingredient category with ID ${id}`,
        () =>
          this.logger.logError(error, 'IngredientCategoriesService.remove', {
            id,
          }),
      );
    }
  }

  /**
   * Soft delete an ingredient category using TypeORM's built-in soft delete
   *
   * @param id Ingredient category ID
   */
  async softDelete(id: number): Promise<void> {
    try {
      this.logger.log(`Soft deleting ingredient category with ID: ${id}`);

      // First verify the category exists
      const ingredientCategory = await this.findOne(id);

      // Set the category to inactive before soft-deleting
      ingredientCategory.isActive = false;
      await this.ingredientCategoryRepository.save(ingredientCategory);

      // Use TypeORM's built-in soft delete
      await this.ingredientCategoryRepository.softDelete(id);
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
      // Validate that id is a valid number
      if (!id || isNaN(id)) {
        this.logger.warn(`Invalid ingredient category ID: ${id}`);
        throw new BadRequestException(`Invalid ingredient category ID: ${id}`);
      }

      this.logger.log(
        `Restoring soft-deleted ingredient category with ID: ${id}`,
      );

      // Use TypeORM's built-in restore method
      await this.ingredientCategoryRepository.restore(id);

      // Get the restored category
      const ingredientCategory = await this.findOne(id);

      // Update the category to be active and clear deletion metadata
      ingredientCategory.isActive = true;
      await this.ingredientCategoryRepository.save(ingredientCategory);
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
      const categories = await this.ingredientCategoryRepository.find({
        withDeleted: true,
      });

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

  /**
   * Find ingredient categories by active status
   * @param isActive Active status to filter by
   * @returns Array of ingredient categories with the specified active status
   */
  async findByActiveStatus(isActive: boolean): Promise<IngredientCategory[]> {
    try {
      const categories = await this.ingredientCategoryRepository.find({
        where: { isActive },
        relations: ['ingredients'],
      });

      this.logger.log(
        `Found ${categories.length} ingredient categories with isActive: ${isActive}`,
      );
      return categories;
    } catch (error) {
      return handleError(
        error,
        [],
        `Failed to retrieve ingredient categories with isActive ${isActive}`,
        () =>
          this.logger.logError(
            error,
            'IngredientCategoriesService.findByActiveStatus',
            { isActive },
          ),
      );
    }
  }
}
