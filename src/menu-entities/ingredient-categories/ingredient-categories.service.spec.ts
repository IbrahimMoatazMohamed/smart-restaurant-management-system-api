import { Test, TestingModule } from '@nestjs/testing';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { NotFoundException } from '@nestjs/common';
import { CustomLoggerService } from '../../logger/logger.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';
import { CreateIngredientCategoryDto } from './dto/create-ingredient-category.dto';
// We'll use this in future tests
// import { UpdateIngredientCategoryDto } from './dto/update-ingredient-category.dto';

describe('IngredientCategoriesService', () => {
  let service: IngredientCategoriesService;
  // These are available for use in additional tests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let ingredientsService: IngredientsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      withDeleted: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockIngredientsService = {
    deleteByCategoryId: jest.fn(),
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    logError: jest.fn(),
  };

  const mockTenantRepositoryProvider = {
    getRepository: jest.fn().mockResolvedValue(mockRepository),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientCategoriesService,
        {
          provide: TenantRepositoryProvider,
          useValue: mockTenantRepositoryProvider,
        },
        {
          provide: IngredientsService,
          useValue: mockIngredientsService,
        },
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    // Use resolve() for scoped providers instead of get()
    service = await module.resolve<IngredientCategoriesService>(
      IngredientCategoriesService,
    );
    ingredientsService = module.get<IngredientsService>(IngredientsService);
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create an ingredient category', async (): Promise<void> => {
      // Arrange
      const createDto: CreateIngredientCategoryDto = {
        name: 'Test Category',
        description: 'Test Description',
      };

      const newCategory = {
        id: 1,
        name: 'Test Category',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.create.mockReturnValue(newCategory);
      mockRepository.save.mockResolvedValue(newCategory);
      mockRepository.findOne.mockResolvedValue(newCategory);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(newCategory);
      expect(result).toEqual(newCategory);
    });
  });

  describe('findOne', () => {
    it('should return an ingredient category if it exists', async (): Promise<void> => {
      // Arrange
      const categoryId = 1;
      const category = {
        id: categoryId,
        name: 'Test Category',
        description: 'Test Description',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.findOne.mockResolvedValue(category);

      // Act
      const result = await service.findOne(categoryId);

      // Assert
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId },
        relations: ['ingredients'],
      });
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if ingredient category does not exist', async (): Promise<void> => {
      // Arrange
      const categoryId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(categoryId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId },
        relations: ['ingredients'],
      });
    });
  });
});
