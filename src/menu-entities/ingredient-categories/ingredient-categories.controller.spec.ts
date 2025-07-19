import { Test, TestingModule } from '@nestjs/testing';
import { IngredientCategoriesController } from './ingredient-categories.controller';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { CreateIngredientCategoryDto } from './dto/create-ingredient-category.dto';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { BadRequestException } from '@nestjs/common';
import { CustomLoggerService } from '../../logger/logger.service';

describe('IngredientCategoriesController', () => {
  let controller: IngredientCategoriesController;
  let service: IngredientCategoriesService;

  const mockIngredientCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
    findAllSoftDeleted: jest.fn(),
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientCategoriesController],
      providers: [
        {
          provide: IngredientCategoriesService,
          useValue: mockIngredientCategoriesService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    controller = module.get<IngredientCategoriesController>(
      IngredientCategoriesController,
    );
    service = module.get<IngredientCategoriesService>(
      IngredientCategoriesService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ingredient category', async () => {
      // Arrange
      const createDto: CreateIngredientCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };

      const expectedResult: IngredientCategory = {
        id: 1,
        name: 'Test Category',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ingredients: [],
      };

      mockIngredientCategoriesService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createDto);

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return an ingredient category by id', async () => {
      // Arrange
      const categoryId = '1';
      const expectedResult: IngredientCategory = {
        id: 1,
        name: 'Test Category',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ingredients: [],
      };

      mockIngredientCategoriesService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(categoryId);

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException when id is not a number', async () => {
      // Arrange
      const invalidId = 'invalid';
      const findOneSpy = jest.spyOn(service, 'findOne');

      // Act & Assert
      try {
        await controller.findOne(invalidId);
        // If we reach here, the test should fail
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        if (error instanceof BadRequestException) {
          expect(error.message).toContain('Invalid ingredient category ID');
        }
      }

      // Verify service method was not called
      expect(findOneSpy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete an ingredient category', async () => {
      // Arrange
      const categoryId = '1';
      mockIngredientCategoriesService.remove.mockResolvedValue(undefined);

      // Act
      await controller.remove(categoryId);

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when id is not a number', async () => {
      // Arrange
      const invalidId = 'invalid';
      const removeSpy = jest.spyOn(service, 'remove');

      // Act & Assert
      try {
        await controller.remove(invalidId);
        // If we reach here, the test should fail
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        if (error instanceof BadRequestException) {
          expect(error.message).toContain('Invalid ingredient category ID');
        }
      }

      // Verify service method was not called
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted ingredient category', async () => {
      // Arrange
      const categoryId = '1';
      mockIngredientCategoriesService.restore.mockResolvedValue(undefined);

      // Act
      await controller.restore(categoryId);

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.restore).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when id is not a number', async () => {
      // Arrange
      const invalidId = 'invalid';
      const restoreSpy = jest.spyOn(service, 'restore');

      // Act & Assert
      try {
        await controller.restore(invalidId);
        // If we reach here, the test should fail
        fail('Expected BadRequestException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        if (error instanceof BadRequestException) {
          expect(error.message).toContain('Invalid ingredient category ID');
        }
      }

      // Verify service method was not called
      expect(restoreSpy).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all ingredient categories excluding soft-deleted ones by default', async () => {
      // Arrange
      const expectedResult: IngredientCategory[] = [
        {
          id: 1,
          name: 'Category 1',
          description: 'Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          ingredients: [],
        },
        {
          id: 2,
          name: 'Category 2',
          description: 'Description 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          ingredients: [],
        },
      ];

      mockIngredientCategoriesService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return all ingredient categories including soft-deleted ones when includeDeleted=true', async () => {
      // Arrange
      const expectedResult: IngredientCategory[] = [
        {
          id: 1,
          name: 'Category 1',
          description: 'Description 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          ingredients: [],
        },
        {
          id: 2,
          name: 'Category 2',
          description: 'Description 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date(),
          ingredients: [],
        },
      ];

      mockIngredientCategoriesService.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll('true');

      // Assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(expectedResult);
    });
  });
});
