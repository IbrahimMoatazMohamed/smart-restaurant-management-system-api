import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TableReservationsService } from './table-reservations.service';
import { CreateTableReservationDto } from './dto/create-table-reservation.dto';
import { UpdateTableReservationDto } from './dto/update-table-reservation.dto';
import { TableReservationResponseDto } from './dto/table-reservation-response.dto';
import { ReservationStatus } from './entities/table-reservation.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  AdminOnly,
  RequirePermissions,
} from '../../auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MeOrAdmin } from '../../auth/decorators/me-or-admin.decorator';

@ApiTags('table-reservations')
@Controller('table-reservations')
export class TableReservationsController {
  constructor(
    private readonly tableReservationsService: TableReservationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new table reservation' })
  @ApiResponse({
    status: 201,
    description: 'The reservation has been successfully created.',
    type: TableReservationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  @ApiBody({ type: CreateTableReservationDto })
  async create(
    @Body() createTableReservationDto: CreateTableReservationDto,
  ): Promise<TableReservationResponseDto> {
    return this.tableReservationsService.create(createTableReservationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.read')
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all table reservations' })
  @ApiResponse({
    status: 200,
    description: 'Return all reservations.',
    type: [TableReservationResponseDto],
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by reservation date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by reservation status',
    enum: ReservationStatus,
  })
  async findAll(
    @Query('date') date?: string,
    @Query('status') status?: ReservationStatus,
  ): Promise<TableReservationResponseDto[]> {
    return this.tableReservationsService.findAll(date, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.read')
  @Get('table/:tableId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get reservations for a specific table' })
  @ApiResponse({
    status: 200,
    description: 'Return reservations for the specified table.',
    type: [TableReservationResponseDto],
  })
  @ApiParam({
    name: 'tableId',
    description: 'ID of the table to get reservations for',
  })
  async findByTable(
    @Param('tableId', ParseIntPipe) tableId: number,
  ): Promise<TableReservationResponseDto[]> {
    return this.tableReservationsService.findByTable(tableId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get reservations for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Return reservations for the specified user.',
    type: [TableReservationResponseDto],
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to get reservations for',
  })
  async findByUser(
    @MeOrAdmin() userId: number,
  ): Promise<TableReservationResponseDto[]> {
    return this.tableReservationsService.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.read')
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific table reservation' })
  @ApiResponse({
    status: 200,
    description: 'Return the reservation.',
    type: TableReservationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiParam({ name: 'id', description: 'ID of the reservation to get' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TableReservationResponseDto> {
    return this.tableReservationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.update')
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a table reservation' })
  @ApiResponse({
    status: 200,
    description: 'The reservation has been successfully updated.',
    type: TableReservationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiParam({ name: 'id', description: 'ID of the reservation to update' })
  @ApiBody({ type: UpdateTableReservationDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTableReservationDto: UpdateTableReservationDto,
  ): Promise<TableReservationResponseDto> {
    return this.tableReservationsService.update(id, updateTableReservationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.update')
  @Patch(':id/cancel')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a table reservation' })
  @ApiResponse({
    status: 200,
    description: 'The reservation has been successfully cancelled.',
    type: TableReservationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiParam({ name: 'id', description: 'ID of the reservation to cancel' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TableReservationResponseDto> {
    return this.tableReservationsService.cancel(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.update')
  @Patch(':id/confirm')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm a table reservation' })
  @ApiResponse({
    status: 200,
    description: 'The reservation has been successfully confirmed.',
    type: TableReservationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiParam({ name: 'id', description: 'ID of the reservation to confirm' })
  async confirm(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TableReservationResponseDto> {
    return this.tableReservationsService.confirm(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.update')
  @Patch(':id/complete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a table reservation as completed' })
  @ApiResponse({
    status: 200,
    description: 'The reservation has been successfully marked as completed.',
    type: TableReservationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiParam({ name: 'id', description: 'ID of the reservation to complete' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TableReservationResponseDto> {
    return this.tableReservationsService.complete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @RequirePermissions('tableReservations.delete')
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a table reservation' })
  @ApiResponse({
    status: 204,
    description: 'The reservation has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  @ApiParam({ name: 'id', description: 'ID of the reservation to delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tableReservationsService.remove(id);
  }
}
