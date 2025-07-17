import { Test, TestingModule } from '@nestjs/testing';
import { ItemIngredientsController } from './item-ingredients.controller';
import { ItemIngredientsService } from './item-ingredients.service';
import { CreateItemIngredientDto } from './dto/create-item-ingredient.dto';
import { ItemIngredientResponseDto } from './dto/item-ingredients-response.dto';
import { ItemIngredient } from './entities/item-ingredient.entity';
import Measurement from '../ingredients/types/measurement.enum';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CustomLoggerService } from '../../logger/logger.service';

describe('ItemIngredientsController', (): void => {
  let controller: ItemIngredientsController;
  let service: ItemIngredientsService;

  const mockItemIngredientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByItemId: jest.fn(),
    findByIngredientId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Mock for CustomLoggerService
  const mockCustomLoggerService = {
    setContext: jest.fn().mockReturnThis(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    logError: jest.fn(),
  };

  // Mock for JwtAuthGuard
  const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

  // Mock for RolesGuard
  const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemIngredientsController],
      providers: [
        {
          provide: ItemIngredientsService,
          useValue: mockItemIngredientsService,
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(['admin']) },
        },
        {
          provide: CustomLoggerService,
          useValue: mockCustomLoggerService,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
        {
          provide: RolesGuard,
          useValue: mockRolesGuard,
        },
      ],
    }).compile();

    controller = module.get<ItemIngredientsController>(
      ItemIngredientsController,
    );
    service = module.get<ItemIngredientsService>(ItemIngredientsService);
  });

  it('should be defined', (): void => {
    expect(controller).toBeDefined();
  });

  it('should create a new item ingredient', async (): Promise<void> => {
    // Arrange
    const createDto: CreateItemIngredientDto = {
      itemId: 1,
      ingredientId: 2,
      qty: 100,
      measurement: Measurement.GRAM,
    };
    const expectedResult = {
      id: 1,
      item_id: 1,
      ingredient_id: 2,
      qty: 100,
      measurement: Measurement.GRAM,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ItemIngredientResponseDto;
    jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

    // Act
    const result = await controller.create(createDto);

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.create).toHaveBeenCalledWith(createDto);
    expect(result).toEqual(expectedResult);
  });

  it('should find ingredients by item ID', async () => {
    // Arrange
    const itemId = 1;
    const expectedResult: ItemIngredient[] = [
      {
        id: 1,
        item_id: 1,
        ingredient_id: 2,
        qty: 100,
        measurement: Measurement.GRAM,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ingredient: { id: 2, name: 'Salt' } as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        item: { id: 1 } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ItemIngredient,
      {
        id: 2,
        item_id: 1,
        ingredient_id: 3,
        qty: 200,
        measurement: Measurement.GRAM,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ingredient: { id: 3, name: 'Pepper' } as any,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        item: { id: 1 } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ItemIngredient,
    ];
    jest.spyOn(service, 'findByItemId').mockResolvedValue(expectedResult);

    // Act
    const result = await controller.findByItemId(itemId);

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.findByItemId).toHaveBeenCalledWith(itemId);
    expect(result).toEqual(expectedResult);
  });
});
