import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      // Verify all items exist and get their details
      const items = await Promise.all(
        createMealDto.itemIds.map(async (id) => {
          await validateEntityExists(id, this.itemsService, 'Item');
          return this.itemsService.findOne(id);
        }),
      );

      // Create and save the meal
      const meal = this.mealsRepository.create({
        ...createMealDto,
        items,
      });

      return await this.mealsRepository.save(meal);
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
   * Find all meals
   *
   * @returns List of all meals
   */
  async findAll() {
    try {
      return await this.mealsRepository.find();
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

      // If updating name, check if the new name already exists for another meal
      if (updateMealDto.name && updateMealDto.name !== existingMeal.name) {
        await this.checkMealNameExists(updateMealDto.name, id);
      }

      // Verify category exists if provided
      if (updateMealDto.categoryId) {
        await validateEntityExists(
          updateMealDto.categoryId,
          this.menuCategoriesService,
          'Category',
        );
      }

      // Verify all items exist if provided
      if (updateMealDto.itemIds && updateMealDto.itemIds.length > 0) {
        await Promise.all(
          updateMealDto.itemIds.map(async (itemId) => {
            await validateEntityExists(itemId, this.itemsService, 'Item');
          }),
        );
      }

      const allowedFields = ['name', 'description', 'price', 'categoryId'];
      const updatedFields = Object.fromEntries(
        Object.entries(updateMealDto).filter(
          ([key, value]) => allowedFields.includes(key) && value !== undefined,
        ),
      );

      await this.mealsRepository.update(id, updatedFields);

      // If item IDs are provided, update the items relation
      if (updateMealDto.itemIds && updateMealDto.itemIds.length > 0) {
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
   * Remove a meal
   *
   * @param id Meal ID
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if meal exists
      await this.findOne(id);

      await this.mealsRepository.delete(id);
    } catch (err) {
      handleError(
        err,
        [NotFoundException],
        `Failed to delete meal with ID ${id}`,
        () => {
          this.logger.logError(err, 'MealsService.remove', { id });
        },
      );
    }
  }
}
