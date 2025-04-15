import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Table } from './entities/table.entity';
import { CustomLoggerService } from '../../logger/logger.service';
import { handleError } from '../../utils/error-handler.util';

/**
 * Tables Service
 *
 * Handles table-related operations
 */
@Injectable()
export class TablesService {
  /**
   * Constructor
   *
   * Initializes the tables repository, and custom logger
   */
  constructor(
    @InjectRepository(Table)
    private readonly tablesRepository: Repository<Table>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('TablesService');
  }

  /**
   * Check if a table with the given name already exists
   *
   * @param tableName Table name to check
   * @param excludeId Optional table ID to exclude from the check (for updates)
   * @throws ConflictException if table with the name already exists
   */
  private async checkTableNameExists(tableName: string, excludeId?: number) {
    const existingTable = await this.tablesRepository.findOne({
      where: { tableName },
      ...(excludeId && { where: { tableName, id: Not(excludeId) } }),
    });

    if (existingTable) {
      throw new ConflictException(
        `Table with name '${tableName}' already exists`,
      );
    }
  }

  /**
   * Create a new table
   *
   * @param createTableDto Table creation data
   * @returns Created table
   */
  async create(createTableDto: CreateTableDto) {
    try {
      // Check if table name already exists
      await this.checkTableNameExists(createTableDto.tableName);

      // Create and save the table
      const table = this.tablesRepository.create(createTableDto);
      return await this.tablesRepository.save(table);
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, ConflictException],
        'Failed to create table',
        () => {
          this.logger.logError(err, 'TablesService.create', {
            dto: createTableDto,
          });
        },
      );
    }
  }

  /**
   * Find all tables
   *
   * @returns List of all tables
   */
  async findAll() {
    try {
      return await this.tablesRepository.find();
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve tables', () => {
        this.logger.logError(err, 'TablesService.findAll');
      });
    }
  }

  /**
   * Find a table by ID
   *
   * @param id Table ID
   * @returns Table with relations
   */
  async findOne(id: number) {
    try {
      const table = await this.tablesRepository.findOne({
        where: { id },
      });

      if (!table) {
        throw new BadRequestException(`Table with ID ${id} not found`);
      }

      return table;
    } catch (err) {
      return handleError(
        err,
        [BadRequestException],
        `Failed to retrieve table with ID ${id}`,
        () => {
          this.logger.logError(err, 'TablesService.findOne', { id });
        },
      );
    }
  }

  /**
   * Update an existing table
   *
   * @param id Table ID
   * @param updateTableDto Table update data
   * @returns Updated table
   */
  async update(id: number, updateTableDto: UpdateTableDto) {
    try {
      // Check if the table exists
      const table = await this.findOne(id);

      // Check if table name is being updated and if it already exists
      if (updateTableDto.tableName) {
        await this.checkTableNameExists(updateTableDto.tableName, id);
      }

      // Update properties using a dynamic approach
      const allowedFields = ['tableName', 'capacity', 'status'];
      const updatedFields = Object.fromEntries(
        Object.entries(updateTableDto).filter(
          ([key, value]) => allowedFields.includes(key) && value !== undefined,
        ),
      );

      // Apply updates
      Object.assign(table, updatedFields);

      return await this.tablesRepository.save(table);
    } catch (err) {
      return handleError(
        err,
        [BadRequestException, ConflictException, NotFoundException],
        `Failed to update table with ID ${id}`,
        () => {
          this.logger.logError(err, 'TablesService.update', {
            id,
            dto: updateTableDto,
          });
        },
      );
    }
  }

  /**
   * Remove a table by ID
   *
   * @param id Table ID
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if table exists
      // const table = this.findOne(id);

      //TODO
      // Check if table has associated orders
      // if (table.orders && table.orders.length > 0) {
      //   throw new BadRequestException(
      //     `Cannot delete table with ID ${id} because it has associated orders`,
      //   );
      // }

      await this.tablesRepository.delete(id);
    } catch (err) {
      return handleError(
        err,
        [],
        `Failed to delete table with ID ${id}`,
        () => {
          this.logger.logError(err, 'TablesService.remove', { id });
        },
      );
    }
  }
}
