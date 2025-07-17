/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ItemIngredientsService } from './item-ingredients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ItemIngredient } from './entities/item-ingredient.entity';
import { Repository } from 'typeorm';
import { ItemsService } from '../items/items.service';
import { IngredientsService } from '../ingredients/ingredients.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { CreateItemIngredientDto } from './dto/create-item-ingredient.dto';
import Measurement from '../ingredients/types/measurement.enum';

describe('ItemIngredientsService', () => {
  let service: ItemIngredientsService;
  let repository: Repository<ItemIngredient>;
  let itemsService: ItemsService;
  let ingredientsService: IngredientsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockItemsService = {
    findOne: jest.fn(),
  };

  const mockIngredientsService = {
    findOne: jest.fn(),
  };

  const mockLoggerService = {
    setContext: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    logError: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemIngredientsService,
        {
          provide: getRepositoryToken(ItemIngredient),
          useValue: mockRepository,
        },
        {
          provide: ItemsService,
          useValue: mockItemsService,
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

    service = module.get<ItemIngredientsService>(ItemIngredientsService);
    repository = module.get<Repository<ItemIngredient>>(
      getRepositoryToken(ItemIngredient),
    );
    itemsService = module.get<ItemsService>(ItemsService);
    ingredientsService = module.get<IngredientsService>(IngredientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new item ingredient', async () => {
    // Arrange
    const createDto: CreateItemIngredientDto = {
      itemId: 1,
      ingredientId: 2,
      qty: 100,
      measurement: Measurement.GRAM,
    };

    const mockItem = { id: 1, name: 'Test Item' };
    const mockIngredient = { id: 2, name: 'Test Ingredient' };
    const mockCreatedItemIngredient = {
      id: 1,
      item_id: 1,
      ingredient_id: 2,
      qty: 100,
      measurement: Measurement.GRAM,
    };
    const mockSavedItemIngredient = { ...mockCreatedItemIngredient };
    const mockFoundItemIngredient = {
      ...mockSavedItemIngredient,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockItemsService.findOne.mockResolvedValue(mockItem);
    mockIngredientsService.findOne.mockResolvedValue(mockIngredient);
    mockRepository.create.mockReturnValue(mockCreatedItemIngredient);
    mockRepository.save.mockResolvedValue(mockSavedItemIngredient);
    mockRepository.findOne.mockResolvedValue(mockFoundItemIngredient);

    // Act
    const result = await service.create(createDto);

    // Assert
    expect(mockIngredientsService.findOne).toHaveBeenCalledWith(
      createDto.ingredientId,
    );
    expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    expect(mockRepository.save).toHaveBeenCalledWith(mockCreatedItemIngredient);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockSavedItemIngredient.id },
    });
    expect(result).toEqual(mockFoundItemIngredient);
  });

  it('should find ingredients by item ID', async () => {
    // Arrange
    const itemId = 1;
    const mockItem = { id: 1, name: 'Test Item' };
    const mockItemIngredients = [
      {
        id: 1,
        item_id: 1,
        ingredient_id: 2,
        qty: 100,
        measurement: Measurement.GRAM,
        ingredient: { id: 2, name: 'Salt' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        item_id: 1,
        ingredient_id: 3,
        qty: 200,
        measurement: Measurement.GRAM,
        ingredient: { id: 3, name: 'Pepper' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockItemsService.findOne.mockResolvedValue(mockItem);
    mockRepository.find.mockResolvedValue(mockItemIngredients);

    // Act
    const result = await service.findByItemId(itemId);

    // Assert
    expect(mockItemsService.findOne).toHaveBeenCalledWith(itemId);
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { item_id: itemId },
      relations: ['ingredient'],
    });
    expect(result).toEqual(mockItemIngredients);
  });
});
