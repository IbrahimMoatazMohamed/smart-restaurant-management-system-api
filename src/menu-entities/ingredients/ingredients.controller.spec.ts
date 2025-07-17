import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { Ingredient } from './entities/ingredient.entity';

describe('IngredientsController', () => {
  let controller: IngredientsController;

  const mockIngredientsService = {
    findAll: jest.fn(),
    findAllWithDeleted: jest.fn(),
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
    // Reset all mocks before each test
    jest.clearAllMocks();
    Object.keys(mockIngredientsService).forEach((key) => {
      mockIngredientsService[
        key as keyof typeof mockIngredientsService
      ].mockReset();
    });
    Object.keys(mockLoggerService).forEach((key) => {
      mockLoggerService[key as keyof typeof mockLoggerService].mockReset();
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientsController],
      providers: [
        { provide: IngredientsService, useValue: mockIngredientsService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<IngredientsController>(IngredientsController);
  });

  it('√ should be defined and properly initialized', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('√ should return all active ingredients when withDeleted is not provided', async () => {
      // Arrange
      const mockIngredients = [
        { id: 1, name: 'Salt' },
        { id: 2, name: 'Pepper' },
      ] as Ingredient[];
      mockIngredientsService.findAll.mockResolvedValue(mockIngredients);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toBe(mockIngredients);
      expect(mockIngredientsService.findAll).toHaveBeenCalled();
      expect(mockIngredientsService.findAllWithDeleted).not.toHaveBeenCalled();
    });

    it('should return all ingredients including deleted ones when withDeleted is true', async () => {
      // Arrange
      const mockIngredients = [
        { id: 1, name: 'Salt' },
        { id: 2, name: 'Pepper', deletedAt: new Date() },
      ] as Ingredient[];
      mockIngredientsService.findAllWithDeleted.mockResolvedValue(
        mockIngredients,
      );
      mockIngredientsService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll('true');

      // Assert
      expect(result).toBe(mockIngredients);
      expect(mockIngredientsService.findAllWithDeleted).toHaveBeenCalled();
      expect(mockIngredientsService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted ingredient', async () => {
      // Arrange
      const ingredientId = '1';
      mockIngredientsService.restore.mockResolvedValue(undefined);

      // Act
      await controller.restore(ingredientId);

      // Assert
      expect(mockIngredientsService.restore).toHaveBeenCalledWith(
        +ingredientId,
      );
    });
  });
});
