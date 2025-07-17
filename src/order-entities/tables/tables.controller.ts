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
  Query,
  UseGuards,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { CustomLoggerService } from '../../logger/logger.service';
import { TableResponseDto } from './dto/table-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  AdminOnly,
  RequirePermissions,
} from '../../auth/decorators/roles.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tables.create')
  @Post()
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tables.read')
  @Get()
  @ApiBearerAuth('JWT-auth')
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
   * Get available tables based on date, time, and party size
   *
   * @param date Date in YYYY-MM-DD format
   * @param time Time in HH:MM format
   * @param partySize Number of people in the party
   * @returns List of available tables
   */
  @Get('available')
  @ApiOperation({ summary: 'Get available tables' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of available tables.',
    type: [TableResponseDto],
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve available tables.',
  })
  async findAvailable(
    @Query('date') date: string,
    @Query('time') time: string,
    @Query('partySize') partySize: number,
  ): Promise<TableResponseDto[]> {
    this.logger.log(
      `Retrieving available tables for date: ${date}, time: ${time}, party size: ${partySize}`,
    );

    return await this.tablesService.findAvailable(date, time, +partySize);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tables.update')
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tables.delete')
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
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
