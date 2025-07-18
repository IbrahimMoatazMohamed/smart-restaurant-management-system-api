import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { Not, Repository, MoreThanOrEqual } from 'typeorm';
import { TenantRepositoryProvider } from '../../tenant/tenant-repository.provider';
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
@Injectable({
  scope: Scope.REQUEST,
})
export class TablesService {
  /**
   * Constructor
   *
   * Initializes the tables repository, and custom logger
   */
  private tableRepoPromise: Promise<Repository<Table>>;

  constructor(
    private readonly tenantRepoProvider: TenantRepositoryProvider,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('TablesService');
    this.tableRepoPromise = this.tenantRepoProvider.getRepository(Table);
  }

  /**
   * Check if a table with the given name already exists
   *
   * @param tableName Table name to check
   * @param excludeId Optional table ID to exclude from the check (for updates)
   * @throws ConflictException if table with the name already exists
   */
  private async checkTableNameExists(tableName: string, excludeId?: number) {
    const tablesRepository = await this.tableRepoPromise;
    const existingTable = await tablesRepository.findOne({
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
      const tablesRepository = await this.tableRepoPromise;
      const table = tablesRepository.create(createTableDto);
      return await tablesRepository.save(table);
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
      const tablesRepository = await this.tableRepoPromise;
      return await tablesRepository.find();
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve tables', () => {
        this.logger.logError(err, 'TablesService.findAll');
      });
    }
  }

  /**
   * Find available tables based on date, time, and party size
   *
   * @param date Date in YYYY-MM-DD format
   * @param time Time in HH:MM format
   * @param partySize Number of people in the party
   * @returns List of available tables
   */
  async findAvailable(date: string, time: string, partySize: number) {
    try {
      this.logger.log(
        `Finding available tables for ${date} at ${time} for party of ${partySize}`,
      );

      const tablesRepository = await this.tableRepoPromise;
      const tables = await tablesRepository.find({
        where: {
          capacity: MoreThanOrEqual(partySize),
        },
      });

      return tables;
    } catch (err) {
      return handleError(err, [], 'Failed to retrieve available tables', () => {
        this.logger.logError(err, 'TablesService.findAvailable', {
          date,
          time,
          partySize,
        });
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
      const tablesRepository = await this.tableRepoPromise;
      const table = await tablesRepository.findOne({
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

      const tablesRepository = await this.tableRepoPromise;
      return await tablesRepository.save(table);
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

      const tablesRepository = await this.tableRepoPromise;
      await tablesRepository.delete(id);
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
