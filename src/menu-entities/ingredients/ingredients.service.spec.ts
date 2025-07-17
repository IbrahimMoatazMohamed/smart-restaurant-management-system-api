import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsService } from './ingredients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { Repository } from 'typeorm';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import Measurement from './types/measurement.enum';

describe('IngredientsService', () => {
  let service: IngredientsService;
  // These variables are declared for potential future tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<Ingredient>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let logger: CustomLoggerService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logError: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        {
          provide: getRepositoryToken(Ingredient),
          useValue: mockRepository,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
    repository = module.get<Repository<Ingredient>>(
      getRepositoryToken(Ingredient),
    );
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create an ingredient', async () => {
      // Arrange
      const createIngredientDto: CreateIngredientDto = {
        name: 'Salt',
        stock: 100,
        measurement: Measurement.GRAM,
        warningAt: 20,
        categoryId: 1,
        pricePerUnit: 2.99,
      };

      const createdIngredient = {
        id: 1,
        ...createIngredientDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Ingredient;

      mockRepository.create.mockReturnValue(createdIngredient);
      mockRepository.save.mockResolvedValue(createdIngredient);

      // Act
      const result = await service.create(createIngredientDto);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(createIngredientDto);
      expect(mockRepository.save).toHaveBeenCalledWith(createdIngredient);
      expect(result).toEqual(createdIngredient);
    });

    it('should throw ConflictException when ingredient with same name exists', async () => {
      // Arrange
      const createIngredientDto: CreateIngredientDto = {
        name: 'Salt',
        stock: 100,
        measurement: Measurement.GRAM,
        warningAt: 20,
        categoryId: 1,
        pricePerUnit: 2.99,
      };

      const duplicateError = {
        code: 'ER_DUP_ENTRY',
        sqlMessage: "Duplicate entry 'Salt' for key 'ingredients.name'",
      };

      mockRepository.create.mockReturnValue(createIngredientDto);
      mockRepository.save.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(service.create(createIngredientDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('decreaseQuantity', () => {
    it('should decrease ingredient quantity and return warning flag when below threshold', async () => {
      // Arrange
      const ingredientId = 1;
      const updateQuantityDto: UpdateQuantityDto = {
        amount: 30,
        measurement: Measurement.GRAM,
      };

      const existingIngredient = {
        id: ingredientId,
        name: 'Salt',
        stock: 50,
        measurement: Measurement.GRAM,
        warningAt: 30,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Ingredient;

      const updatedIngredient = {
        ...existingIngredient,
        stock: 20, // 50 - 30 = 20
      } as Ingredient;

      mockRepository.findOne.mockResolvedValue(existingIngredient);
      mockRepository.save.mockResolvedValue(updatedIngredient);

      // Act
      const result = await service.decreaseQuantity(
        ingredientId,
        updateQuantityDto,
      );

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: ingredientId },
        relations: ['category'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        ingredient: updatedIngredient,
        belowWarningThreshold: true, // 20 < 30
      });
    });

    it('should throw NotFoundException when ingredient does not exist', async () => {
      // Arrange
      const ingredientId = 999;
      const updateQuantityDto: UpdateQuantityDto = {
        amount: 10,
        measurement: Measurement.GRAM,
      };

      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.decreaseQuantity(ingredientId, updateQuantityDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted ingredients', async () => {
      // Arrange
      const ingredients = [
        {
          id: 1,
          name: 'Salt',
          stock: 100,
          measurement: Measurement.GRAM,
          warningAt: 20,
          categoryId: 1,
          pricePerUnit: 2.99,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          category: { id: 1, name: 'Spices' },
          itemIngredients: [],
        },
        {
          id: 2,
          name: 'Pepper',
          stock: 50,
          measurement: Measurement.GRAM,
          warningAt: 10,
          categoryId: 1,
          pricePerUnit: 3.99,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          category: { id: 1, name: 'Spices' },
          itemIngredients: [],
        },
      ] as unknown as Ingredient[];

      mockRepository.find.mockResolvedValue(ingredients);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(ingredients);
    });
  });

  describe('findAllWithDeleted', () => {
    it('should return all ingredients including soft-deleted ones', async () => {
      // Arrange
      const ingredients = [
        {
          id: 1,
          name: 'Salt',
          stock: 100,
          measurement: Measurement.GRAM,
          warningAt: 20,
          categoryId: 1,
          pricePerUnit: 2.99,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          category: { id: 1, name: 'Spices' },
          itemIngredients: [],
        },
        {
          id: 2,
          name: 'Pepper',
          stock: 50,
          measurement: Measurement.GRAM,
          warningAt: 10,
          categoryId: 1,
          pricePerUnit: 3.99,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date(),
          category: { id: 1, name: 'Spices' },
          itemIngredients: [],
        },
      ] as unknown as Ingredient[];

      mockRepository.find.mockResolvedValue(ingredients);

      // Act
      const result = await service.findAllWithDeleted();

      // Assert
      expect(mockRepository.find).toHaveBeenCalledWith({
        withDeleted: true,
        relations: ['category'],
      });
      expect(result).toEqual(ingredients);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted ingredient', async () => {
      // Arrange
      const ingredientId = 1;
      const deletedIngredient = {
        id: ingredientId,
        name: 'Salt',
        stock: 100,
        measurement: Measurement.GRAM,
        warningAt: 20,
        categoryId: 1,
        pricePerUnit: 2.99,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
        category: { id: 1, name: 'Spices' },
        itemIngredients: [],
      } as unknown as Ingredient;

      const restoredIngredient = {
        ...deletedIngredient,
        deletedAt: null,
      } as unknown as Ingredient;

      mockRepository.findOne.mockResolvedValue(deletedIngredient);
      mockRepository.restore.mockResolvedValue(undefined);
      mockRepository.findOne.mockResolvedValueOnce(restoredIngredient);

      // Act
      await service.restore(ingredientId);

      // Assert
      expect(mockRepository.restore).toHaveBeenCalledWith(ingredientId);
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        `Ingredient with ID ${ingredientId} has been restored`,
      );
    });

    it('should throw NotFoundException when ingredient does not exist', async () => {
      // Arrange
      const ingredientId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.restore(ingredientId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
