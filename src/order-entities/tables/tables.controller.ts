import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { TableResponseDto } from './dto/table-response.dto';

/**
 * Tables Controller
 *
 * Handles table-related operations
 */
@ApiTags('tables')
@Controller('tables')
export class TablesController {
  /**
   * Constructor
   *
   * Initializes the tables service and custom logger
   */
  constructor(
    private readonly tablesService: TablesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('TablesController');
  }

  /**
   * Create a new table
   *
   * @param createTableDto Table creation data
   * @returns Created table
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new table' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Table has been successfully created.',
    type: TableResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiConflictResponse({
    description: 'Table with the same name already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create table.',
  })
  async create(
    @Body() createTableDto: CreateTableDto,
  ): Promise<TableResponseDto> {
    this.logger.log(
      `Creating new table with name: ${createTableDto.tableName}`,
    );

    return await this.tablesService.create(createTableDto);
  }

  /**
   * Get all tables
   *
   * @returns List of all tables
   */
  @Get()
  @ApiOperation({ summary: 'Get all tables' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all tables.',
    type: [TableResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve tables.',
  })
  async findAll(): Promise<TableResponseDto[]> {
    this.logger.log('Retrieving all tables');

    return await this.tablesService.findAll();
  }

  /**
   * Get a table by ID
   *
   * @param id Table ID
   * @returns Table
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a table by ID' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Table found.',
    type: TableResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Table not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve table.',
  })
  async findOne(@Param('id') id: string): Promise<TableResponseDto> {
    this.logger.log(`Retrieving table with ID: ${id}`);

    return await this.tablesService.findOne(+id);
  }

  /**
   * Update a table
   *
   * @param id Table ID
   * @param updateTableDto Table update data
   * @returns Updated table
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Table has been successfully updated.',
    type: TableResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Table not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiConflictResponse({
    description: 'Table with the same name already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update table.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
  ): Promise<TableResponseDto> {
    this.logger.log(`Updating table with ID: ${id}`);

    return await this.tablesService.update(+id, updateTableDto);
  }

  /**
   * Delete a table
   *
   * @param id Table ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Table has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Table not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete table.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting table with ID: ${id}`);

    await this.tablesService.remove(+id);
  }
}
