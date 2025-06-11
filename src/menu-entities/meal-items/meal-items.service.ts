import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { CreateMealItemDto } from './dto/create-meal-item.dto';
import { UpdateMealItemDto } from './dto/update-meal-item.dto';
import { MealItem } from './entities/meal-item.entity';
import { MealsService } from '../meals/meals.service';
import { ItemsService } from '../items/items.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';
import { validateEntityExists } from '../../utils/entity-validation.util';

@Injectable()
export class MealItemsService {
  constructor(
    @InjectRepository(MealItem)
    private readonly mealItemRepository: Repository<MealItem>,
    @Inject(forwardRef(() => MealsService))
    private readonly mealsService: MealsService,
    private readonly itemsService: ItemsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MealItemsService');
  }

  async create(createMealItemDto: CreateMealItemDto): Promise<MealItem> {
    try {
      this.logger.log(
        `Creating meal item: ${JSON.stringify(createMealItemDto)}`,
      );

      await validateEntityExists(
        createMealItemDto.mealId,
        this.mealsService,
        'Meal',
      );

      await validateEntityExists(
        createMealItemDto.itemId,
        this.itemsService,
        'Item',
      );

      const existingMealItem = await this.mealItemRepository.findOne({
        where: {
          mealId: createMealItemDto.mealId,
          itemId: createMealItemDto.itemId,
        },
        withDeleted: true,
      });

      if (existingMealItem) {
        if (existingMealItem.deletedAt) {
          this.logger.log(
            `Restoring soft-deleted meal item and updating quantity`,
          );
          existingMealItem.isActive = true;
          existingMealItem.quantity =
            createMealItemDto.quantity || existingMealItem.quantity;
          return this.mealItemRepository.save(existingMealItem);
        }

        throw new ConflictException(
          `Item with ID ${createMealItemDto.itemId} is already added to meal with ID ${createMealItemDto.mealId}`,
        );
      }

      const mealItem = this.mealItemRepository.create({
        ...createMealItemDto,
        isActive: true,
      });

      const savedMealItem = await this.mealItemRepository.save(mealItem);
      this.logger.log(
        `Meal item created successfully with ID: ${savedMealItem.mealId}-${savedMealItem.itemId}`,
      );

      return savedMealItem;
    } catch (err) {
      return handleError(
        err,
        [NotFoundException, BadRequestException, ConflictException],
        `Failed to create meal item`,
        () => {
          this.logger.logError(err, 'MealItemsService.create', {
            dto: createMealItemDto,
          });
        },
      );
    }
  }

  async findAll(includeDeleted: boolean = false): Promise<MealItem[]> {
    try {
      this.logger.log(
        `Finding all meal items, includeDeleted: ${includeDeleted}`,
      );

      return this.mealItemRepository.find({
        relations: ['meal', 'item'],
        withDeleted: includeDeleted,
      });
    } catch (error) {
      return handleError(error, [], 'Failed to find all meal items', () => {
        this.logger.logError(error, 'MealItemsService.findAll', {
          includeDeleted,
        });
      });
    }
  }

  async findAllSoftDeleted(): Promise<MealItem[]> {
    try {
      this.logger.log('Finding all soft-deleted meal items');

      return this.mealItemRepository.find({
        relations: ['meal', 'item'],
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
      });
    } catch (error) {
      return handleError(
        error,
        [],
        'Failed to find soft-deleted meal items',
        () => {
          this.logger.logError(
            error,
            'MealItemsService.findAllSoftDeleted',
            {},
          );
        },
      );
    }
  }

  async findByMealId(
    mealId: number,
    includeDeleted = false,
  ): Promise<MealItem[]> {
    try {
      this.logger.log(`Finding meal items by mealId: ${mealId}`);

      return this.mealItemRepository.find({
        where: { mealId },
        relations: ['item'],
        withDeleted: includeDeleted,
      });
    } catch (error) {
      return handleError(
        error,
        [],
        'Failed to find meal items by mealId',
        () => {
          this.logger.logError(error, 'MealItemsService.findByMealId', {
            mealId,
            includeDeleted,
          });
        },
      );
    }
  }

  async findOne(
    mealId: number,
    itemId: number,
    includeDeleted = false,
  ): Promise<MealItem> {
    try {
      this.logger.log(
        `Finding meal item with mealId: ${mealId}, itemId: ${itemId}`,
      );

      const mealItem = await this.mealItemRepository.findOne({
        where: { mealId, itemId },
        relations: ['meal', 'item'],
        withDeleted: includeDeleted,
      });

      if (!mealItem) {
        throw new NotFoundException(
          `Meal item with mealId ${mealId} and itemId ${itemId} not found`,
        );
      }

      return mealItem;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to find meal item with mealId ${mealId} and itemId ${itemId}`,
        () => {
          this.logger.logError(error, 'MealItemsService.findOne', {
            mealId,
            itemId,
            includeDeleted,
          });
        },
      );
    }
  }

  async update(
    mealId: number,
    itemId: number,
    updateMealItemDto: UpdateMealItemDto,
  ): Promise<MealItem> {
    try {
      this.logger.log(
        `Updating meal item with mealId: ${mealId}, itemId: ${itemId}`,
      );

      const mealItem = await this.findOne(mealId, itemId);

      if (updateMealItemDto.quantity) {
        mealItem.quantity = updateMealItemDto.quantity;
      }

      const updatedMealItem = await this.mealItemRepository.save(mealItem);
      this.logger.log(`Meal item updated successfully`);

      return updatedMealItem;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException],
        `Failed to update meal item with mealId ${mealId} and itemId ${itemId}`,
        () => {
          this.logger.logError(error, 'MealItemsService.update', {
            mealId,
            itemId,
            dto: updateMealItemDto,
          });
        },
      );
    }
  }

  async remove(mealId: number, itemId: number): Promise<void> {
    try {
      this.logger.log(
        `Hard deleting meal item with mealId: ${mealId}, itemId: ${itemId}`,
      );

      const mealItem = await this.findOne(mealId, itemId);
      await this.mealItemRepository.remove(mealItem);

      this.logger.log(`Meal item hard deleted successfully`);
    } catch (error) {
      handleError(
        error,
        [NotFoundException],
        `Failed to hard delete meal item with mealId ${mealId} and itemId ${itemId}`,
        () => {
          this.logger.logError(error, 'MealItemsService.remove', {
            mealId,
            itemId,
          });
        },
      );
    }
  }

  async softDelete(mealId: number, itemId: number): Promise<void> {
    try {
      this.logger.log(
        `Soft deleting meal item with mealId: ${mealId}, itemId: ${itemId}`,
      );

      await this.findOne(mealId, itemId);
      await this.mealItemRepository.softDelete({ mealId, itemId });

      this.logger.log(`Meal item soft deleted successfully`);
    } catch (error) {
      handleError(
        error,
        [NotFoundException],
        `Failed to soft delete meal item with mealId ${mealId} and itemId ${itemId}`,
        () => {
          this.logger.logError(error, 'MealItemsService.softDelete', {
            mealId,
            itemId,
          });
        },
      );
    }
  }

  async restore(mealId: number, itemId: number): Promise<MealItem> {
    try {
      this.logger.log(
        `Restoring soft-deleted meal item with mealId: ${mealId}, itemId: ${itemId}`,
      );

      // Check if the meal item exists in deleted items
      const deletedMealItem = await this.findOne(mealId, itemId, true);

      if (!deletedMealItem.deletedAt) {
        throw new BadRequestException(`Meal item is not deleted`);
      }

      // Restore the meal item
      await this.mealItemRepository.restore({ mealId, itemId });

      // Update the meal item to be active
      const restoredMealItem = await this.findOne(mealId, itemId);
      restoredMealItem.isActive = true;
      await this.mealItemRepository.save(restoredMealItem);

      this.logger.log(`Meal item restored successfully`);
      return restoredMealItem;
    } catch (error) {
      return handleError(
        error,
        [NotFoundException, BadRequestException],
        `Failed to restore meal item with mealId ${mealId} and itemId ${itemId}`,
        () => {
          this.logger.logError(error, 'MealItemsService.restore', {
            mealId,
            itemId,
          });
        },
      );
    }
  }

  async removeAllByMealId(mealId: number): Promise<void> {
    try {
      this.logger.log(`Hard deleting all meal items for mealId: ${mealId}`);

      const mealItems = await this.findByMealId(mealId);
      if (mealItems.length > 0) {
        await this.mealItemRepository.remove(mealItems);
        this.logger.log(
          `${mealItems.length} meal items hard deleted successfully`,
        );
      } else {
        this.logger.log(`No meal items found for mealId: ${mealId}`);
      }
    } catch (error) {
      handleError(
        error,
        [],
        `Failed to hard delete all meal items for meal with ID ${mealId}`,
        () => {
          this.logger.logError(error, 'MealItemsService.removeAllByMealId', {
            mealId,
          });
        },
      );
    }
  }

  async softDeleteAllByMealId(mealId: number): Promise<void> {
    try {
      this.logger.log(`Soft deleting all meal items for mealId: ${mealId}`);

      const mealItems = await this.findByMealId(mealId);
      if (mealItems.length > 0) {
        await this.mealItemRepository.softDelete({ mealId });
        this.logger.log(
          `${mealItems.length} meal items soft deleted successfully`,
        );
      } else {
        this.logger.log(`No meal items found for mealId: ${mealId}`);
      }
    } catch (error) {
      handleError(
        error,
        [],
        `Failed to soft delete all meal items for meal with ID ${mealId}`,
        () => {
          this.logger.logError(
            error,
            'MealItemsService.softDeleteAllByMealId',
            { mealId },
          );
        },
      );
    }
  }
}
