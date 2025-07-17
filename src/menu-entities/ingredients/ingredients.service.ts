import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { handleDuplicateEntryError } from '../../utils/duplicate-entry-handler.util';
import {
  convertMeasurement,
  areMeasurementsCompatible,
} from '../../utils/measurement-conversion.util';
import Measurement from './types/measurement.enum';

@Injectable()
export class IngredientsService {
  /**
   * Constructor
   *
   * Initializes the ingredients service with repository and logger
   */
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientsRepository: Repository<Ingredient>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('IngredientsService');
  }

  /**
   * Create a new ingredient
   * @param createIngredientDto Data for the new ingredient
   * @returns The created ingredient
   */
  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    try {
      this.logger.log(
        `Creating ingredient with name: ${createIngredientDto.name}`,
      );

      // Log if a category is being assigned
      if (createIngredientDto.categoryId) {
        this.logger.log(
          `Assigning ingredient to category ID: ${createIngredientDto.categoryId}`,
        );
      }

      const ingredient = this.ingredientsRepository.create(createIngredientDto);

      return await this.ingredientsRepository.save(ingredient);
    } catch (error) {
      // Handle duplicate entry errors
      handleDuplicateEntryError(
        error,
        `Ingredient with name '${createIngredientDto.name}' already exists`,
        () =>
          this.logger.warn(
            `Attempt to create duplicate ingredient: name: ${createIngredientDto.name}`,
            'IngredientsService.create',
          ),
      );

      return handleError(
        error,
        [ConflictException],
        'Failed to create ingredient',
        () =>
          this.logger.logError(error, 'IngredientsService.create', {
            dto: createIngredientDto,
          }),
      );
    }
  }

  /**
   * Get all ingredients
   *
   * @returns List of all ingredients
   */
  async findAll(): Promise<Ingredient[]> {
    try {
      this.logger.log('Finding all ingredients');
      return await this.ingredientsRepository.find({
        relations: ['category'],
      });
    } catch (error) {
      this.logger.logError(error, 'IngredientsService.findAll');
      throw new InternalServerErrorException('Failed to find ingredients');
    }
  }

  /**
   * Get all ingredients including soft-deleted ones
   *
   * @returns List of all ingredients including soft-deleted ones
   */
  async findAllWithDeleted(): Promise<Ingredient[]> {
    try {
      this.logger.log('Finding all ingredients including soft-deleted ones');
      return await this.ingredientsRepository.find({
        relations: ['category'],
        withDeleted: true,
      });
    } catch (error) {
      this.logger.logError(error, 'IngredientsService.findAllWithDeleted');
      throw new InternalServerErrorException('Failed to find ingredients');
    }
  }

  /**
   * Find one ingredient by ID
   * @param id Ingredient ID
   * @returns The found ingredient
   */
  async findOne(id: number): Promise<Ingredient> {
    try {
      const ingredient = await this.ingredientsRepository.findOne({
        where: { id },
        relations: ['category'],
      });
      if (!ingredient) {
        this.logger.warn(`Ingredient with ID ${id} not found`);
        throw new NotFoundException(`Ingredient with ID ${id} not found`);
      }
      return ingredient;
    } catch (error) {
      this.logger.logError(error, 'IngredientsService.findOne', { id });

      return handleError(
        error,
        [NotFoundException],
        'Failed to find ingredient',
      );
    }
  }

  async findByCategory(categoryId: number): Promise<Ingredient[]> {
    try {
      const ingredients = await this.ingredientsRepository.find({
        where: { categoryId },
      });
      return ingredients;
    } catch (error) {
      this.logger.logError(error, 'IngredientsService.findByCategory', {
        categoryId,
      });

      return handleError(
        error,
        [NotFoundException],
        'Failed to find ingredients by category',
      );
    }
  }

  /**
   * Update an ingredient by ID
   * @param id Ingredient ID to update
   * @param updateIngredientDto Updated ingredient data
   * @returns The updated ingredient
   */
  async update(
    id: number,
    updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredient> {
    try {
      this.logger.log(`Updating ingredient with ID: ${id}`);

      const existingIngredient = await this.findOne(id);
      if (!existingIngredient) {
        throw new NotFoundException(`Ingredient with ID ${id} not found`);
      }

      // Log if category is being updated
      if (updateIngredientDto.categoryId !== undefined) {
        this.logger.log(
          `Updating ingredient category to ID: ${updateIngredientDto.categoryId}`,
        );
      }

      // Update the ingredient
      await this.ingredientsRepository.update(id, updateIngredientDto);

      return await this.findOne(id);
    } catch (error) {
      // Handle duplicate entry errors if the name is being updated to one that already exists
      if (updateIngredientDto.name) {
        handleDuplicateEntryError(
          error,
          `Ingredient with name '${updateIngredientDto.name}' already exists`,
          () =>
            this.logger.warn(
              `Attempt to update to duplicate ingredient: name: ${updateIngredientDto.name}`,
              'IngredientsService.update',
            ),
        );
      }

      return handleError(
        error,
        [ConflictException, NotFoundException],
        'Failed to update ingredient',

        () =>
          this.logger.logError(error, 'IngredientsService.update', {
            id,
            updateIngredientDto,
          }),
      );
    }
  }

  /**
   * Soft delete an ingredient
   * @param id Ingredient ID
   */
  async remove(id: number): Promise<void> {
    try {
      this.logger.log(`Soft deleting ingredient with ID: ${id}`);

      await this.findOne(id);

      await this.ingredientsRepository.softDelete(id);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        'Failed to soft delete ingredient',

        () =>
          this.logger.logError(error, 'IngredientsService.softDelete', { id }),
      );
    }
  }

  /**
   * Delete ingredients by category ID
   * @param categoryId Category ID
   */
  async deleteByCategoryId(categoryId: number): Promise<void> {
    try {
      this.logger.log(`Deleting ingredients by category ID: ${categoryId}`);

      await this.ingredientsRepository.softDelete({ categoryId });
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        'Failed to delete ingredients by category ID',

        () =>
          this.logger.logError(error, 'IngredientsService.deleteByCategoryId', {
            categoryId,
          }),
      );
    }
  }

  /**
   * Restore an ingredient
   * @param id Ingredient ID
   */
  async restore(id: number): Promise<void> {
    try {
      this.logger.log(`Restoring ingredient with ID: ${id}`);

      const ingredient = await this.ingredientsRepository.findOne({
        where: { id },
        withDeleted: true,
        relations: ['category'],
      });

      if (!ingredient) {
        this.logger.warn(`Ingredient with ID ${id} not found`);
        throw new NotFoundException(`Ingredient with ID ${id} not found`);
      }

      // Check if the ingredient's category is deleted
      if (ingredient.category && ingredient.category.deletedAt) {
        this.logger.warn(
          `Cannot restore ingredient with ID ${id} because its category is deleted`,
        );
        throw new BadRequestException(
          `Cannot restore ingredient because its category is deleted. Please restore the category first.`,
        );
      }

      await this.ingredientsRepository.restore(id);

      this.logger.log(`Ingredient with ID ${id} has been restored`);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        'Failed to restore ingredient',

        () => this.logger.logError(error, 'IngredientsService.restore', { id }),
      );
    }
  }

  /**
   * Validates and converts measurements if needed
   * @param amount The amount to convert
   * @param sourceMeasurement The source measurement unit
   * @param targetMeasurement The target measurement unit
   * @param context Additional context for logging
   * @returns The converted amount
   */
  private validateAndConvertMeasurement(
    amount: number,
    sourceMeasurement: Measurement | null,
    targetMeasurement: Measurement,
    context: { id: number; methodName: string },
  ): number {
    // If no source measurement or measurements are the same, no conversion needed
    if (!sourceMeasurement || sourceMeasurement === targetMeasurement) {
      return amount;
    }

    this.logger.log(
      `Converting ${amount} ${sourceMeasurement} to ${targetMeasurement}`,
    );

    try {
      if (!areMeasurementsCompatible(sourceMeasurement, targetMeasurement)) {
        throw new BadRequestException(
          `Cannot convert from ${sourceMeasurement} to ${targetMeasurement}. Incompatible measurement types.`,
        );
      }

      const convertedAmount = convertMeasurement(
        amount,
        sourceMeasurement,
        targetMeasurement,
      );

      this.logger.log(
        `Converted amount: ${convertedAmount} ${targetMeasurement}`,
      );

      return convertedAmount;
    } catch (error) {
      return handleError(
        error,
        [BadRequestException],
        'Failed to convert measurement',

        () =>
          this.logger.logError(
            error,
            `IngredientsService.${context.methodName}.conversion`,
            {
              id: context.id,
              amount,
              sourceMeasurement,
              targetMeasurement,
            },
          ),
      );
    }
  }

  /**
   * Handle quantity change for an ingredient (increase or decrease)
   * @param id Ingredient ID
   * @param amountOrDto Amount to change or update quantity DTO
   * @param isIncrease Whether to increase (true) or decrease (false) the quantity
   * @returns The updated ingredient with warning flag if below threshold
   * @private
   */
  private async handleQuantityChange(
    id: number,
    amountOrDto: number | UpdateQuantityDto,
    isIncrease: boolean,
  ): Promise<{ ingredient: Ingredient; belowWarningThreshold: boolean }> {
    const operation = isIncrease ? 'increase' : 'decrease';

    // Handle the 'e' in verbs correctly: increase -> increasing, decrease -> decreasing
    const gerund = operation + (operation.endsWith('e') ? '' : 'e') + 'ing';
    this.logger.log(
      `${gerund.charAt(0).toUpperCase() + gerund.slice(1)} quantity for ingredient ID: ${id}`,
    );

    // Handle both number and DTO input
    const measurement =
      typeof amountOrDto === 'number' ? null : amountOrDto.measurement || null;

    let amount: number;
    if (typeof amountOrDto === 'number') {
      amount = amountOrDto;
    } else {
      amount = amountOrDto.amount;
    }

    const ingredient = await this.findOne(id);

    amount = this.validateAndConvertMeasurement(
      amount,
      measurement,
      ingredient.measurement,
      { id, methodName: `IngredientService.${operation}Quantity` },
    );

    // Apply the operation (increase or decrease)
    const currentStock = Number(ingredient.stock) || 0;
    ingredient.stock = parseFloat(
      (isIncrease
        ? currentStock + Number(amount)
        : currentStock - Number(amount)
      ).toFixed(4),
    );

    const updatedIngredient = await this.ingredientsRepository.save(ingredient);
    this.logger.log(
      `${gerund.charAt(0).toUpperCase() + gerund.slice(1)}d quantity for ingredient ID: ${id}, new stock: ${updatedIngredient.stock}`,
    );

    const belowWarningThreshold =
      updatedIngredient.stock < updatedIngredient.warningAt;

    if (belowWarningThreshold) {
      this.logger.warn(
        `Ingredient ID: ${id} is below warning threshold (${updatedIngredient.warningAt})`,
      );
    }

    return { ingredient: updatedIngredient, belowWarningThreshold };
  }

  /**
   * Increase the quantity of an ingredient
   * @param id Ingredient ID
   * @param amountOrDto Amount to increase or update quantity DTO
   * @returns The updated ingredient
   */
  async increaseQuantity(
    id: number,
    amountOrDto: number | UpdateQuantityDto,
  ): Promise<Ingredient> {
    try {
      const result = await this.handleQuantityChange(id, amountOrDto, true);
      return result.ingredient;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        'Failed to increase ingredient quantity',

        () =>
          this.logger.logError(error, 'IngredientsService.increaseQuantity', {
            id,
            amountOrDto,
          }),
      );
    }
  }

  /**
   * Decrease the quantity of an ingredient
   * @param id Ingredient ID
   * @param amountOrDto Amount to decrease or update quantity DTO
   * @returns The updated ingredient with warning flag if below threshold
   */
  async decreaseQuantity(
    id: number,
    amountOrDto: number | UpdateQuantityDto,
  ): Promise<{ ingredient: Ingredient; belowWarningThreshold: boolean }> {
    try {
      return await this.handleQuantityChange(id, amountOrDto, false);
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        'Failed to decrease ingredient quantity',

        () =>
          this.logger.logError(error, 'IngredientsService.decreaseQuantity', {
            id,
            amountOrDto,
          }),
      );
    }
  }
}
