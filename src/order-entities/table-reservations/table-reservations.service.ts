import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { format, parseISO, isValid, addHours } from 'date-fns';

import {
  TableReservation,
  ReservationStatus,
} from './entities/table-reservation.entity';
import { Table, TableStatus } from '../tables/entities/table.entity';
import { CreateTableReservationDto } from './dto/create-table-reservation.dto';
import { UpdateTableReservationDto } from './dto/update-table-reservation.dto';
import { TableReservationResponseDto } from './dto/table-reservation-response.dto';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class TableReservationsService {
  constructor(
    @InjectRepository(TableReservation)
    private tableReservationRepository: Repository<TableReservation>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('TableReservationsService');
  }

  /**
   * Create a new table reservation
   * @param createTableReservationDto - The reservation data
   * @returns The created reservation
   */
  async create(
    createTableReservationDto: CreateTableReservationDto,
  ): Promise<TableReservationResponseDto> {
    this.logger.log(
      `Creating reservation for table ID: ${createTableReservationDto.tableId}`,
    );

    const table = await this.tableRepository.findOne({
      where: { id: createTableReservationDto.tableId },
    });

    if (!table) {
      throw new NotFoundException(
        `Table with ID ${createTableReservationDto.tableId} not found`,
      );
    }

    if (table.status === TableStatus.MAINTENANCE) {
      throw new BadRequestException(
        `Table ${table.tableName} is currently under maintenance`,
      );
    }

    if (createTableReservationDto.partySize > table.capacity) {
      throw new BadRequestException(
        `Party size (${createTableReservationDto.partySize}) exceeds table capacity (${table.capacity})`,
      );
    }

    const reservationDate = createTableReservationDto.reservationDate;
    const reservationTime = createTableReservationDto.reservationTime;

    const dateTimeString = `${reservationDate}T${reservationTime}`;
    const reservationDateTime = parseISO(dateTimeString);

    if (!isValid(reservationDateTime)) {
      throw new BadRequestException('Invalid reservation date or time format');
    }

    const now = new Date();
    if (reservationDateTime < now) {
      throw new BadRequestException(
        'Reservation cannot be made for past dates',
      );
    }

    const reservationEndTime = addHours(reservationDateTime, 2);

    const conflictingReservations = await this.tableReservationRepository.find({
      where: {
        tableId: createTableReservationDto.tableId,
        status: ReservationStatus.CONFIRMED,
      },
    });

    for (const reservation of conflictingReservations) {
      const existingReservationTime = parseISO(
        `${reservation.reservationDate.toISOString().split('T')[0]}T${reservation.reservationTime}`,
      );
      const existingEndTime = addHours(existingReservationTime, 2);

      if (
        (reservationDateTime >= existingReservationTime &&
          reservationDateTime < existingEndTime) ||
        (reservationEndTime > existingReservationTime &&
          reservationEndTime <= existingEndTime) ||
        (reservationDateTime <= existingReservationTime &&
          reservationEndTime >= existingEndTime)
      ) {
        throw new BadRequestException(
          `Table ${table.tableName} is already reserved at this time`,
        );
      }
    }

    const reservationData = {
      ...createTableReservationDto,
      userId: createTableReservationDto.userId || null,
      status: createTableReservationDto.status || ReservationStatus.PENDING,
    };

    const newReservation =
      this.tableReservationRepository.create(reservationData);

    const savedReservation =
      await this.tableReservationRepository.save(newReservation);
    return new TableReservationResponseDto(savedReservation);
  }

  /**
   * Find all table reservations
   * @param date Optional date filter
   * @param status Optional status filter
   * @returns List of reservations
   */
  async findAll(
    date?: string,
    status?: ReservationStatus,
  ): Promise<TableReservationResponseDto[]> {
    this.logger.log(
      `Finding all reservations with filters: date=${date}, status=${status}`,
    );

    const queryBuilder =
      this.tableReservationRepository.createQueryBuilder('reservation');
    queryBuilder.leftJoinAndSelect('reservation.table', 'table');
    queryBuilder.leftJoinAndSelect('reservation.user', 'user');

    if (date) {
      const parsedDate = parseISO(date);
      if (isValid(parsedDate)) {
        const formattedDate = format(parsedDate, 'yyyy-MM-dd');
        queryBuilder.andWhere('DATE(reservation.reservationDate) = :date', {
          date: formattedDate,
        });
      }
    }

    if (status) {
      queryBuilder.andWhere('reservation.status = :status', { status });
    }

    queryBuilder.orderBy('reservation.reservationDate', 'ASC');
    queryBuilder.addOrderBy('reservation.reservationTime', 'ASC');

    const reservations = await queryBuilder.getMany();
    return reservations.map(
      (reservation) => new TableReservationResponseDto(reservation),
    );
  }

  /**
   * Find reservations for a specific table
   * @param tableId The table ID
   * @returns List of reservations for the table
   */
  async findByTable(tableId: number): Promise<TableReservationResponseDto[]> {
    this.logger.log(`Finding reservations for table ID: ${tableId}`);

    const reservations = await this.tableReservationRepository.find({
      where: { tableId },
      relations: ['table', 'user'],
      order: {
        reservationDate: 'ASC',
        reservationTime: 'ASC',
      },
    });

    return reservations.map(
      (reservation) => new TableReservationResponseDto(reservation),
    );
  }

  /**
   * Find reservations for a specific user
   * @param userId The user ID
   * @returns List of reservations for the user
   */
  async findByUser(userId: number): Promise<TableReservationResponseDto[]> {
    this.logger.log(`Finding reservations for user ID: ${userId}`);

    const reservations = await this.tableReservationRepository.find({
      where: { userId },
      relations: ['table', 'user'],
      order: {
        reservationDate: 'ASC',
        reservationTime: 'ASC',
      },
    });

    return reservations.map(
      (reservation) => new TableReservationResponseDto(reservation),
    );
  }

  /**
   * Find a specific reservation by ID
   * @param id The reservation ID
   * @returns The reservation
   */
  async findOne(id: number): Promise<TableReservationResponseDto> {
    this.logger.log(`Finding reservation with ID: ${id}`);

    const reservation = await this.tableReservationRepository.findOne({
      where: { id },
      relations: ['table', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return new TableReservationResponseDto(reservation);
  }

  /**
   * Update a reservation
   * @param id The reservation ID
   * @param updateTableReservationDto The updated reservation data
   * @returns The updated reservation
   */
  async update(
    id: number,
    updateTableReservationDto: UpdateTableReservationDto,
  ): Promise<TableReservationResponseDto> {
    this.logger.log(`Updating reservation with ID: ${id}`);

    const reservation = await this.tableReservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // If changing table, check if new table exists and is available
    if (
      updateTableReservationDto.tableId &&
      updateTableReservationDto.tableId !== reservation.tableId
    ) {
      const newTable = await this.tableRepository.findOne({
        where: { id: updateTableReservationDto.tableId },
      });

      if (!newTable) {
        throw new NotFoundException(
          `Table with ID ${updateTableReservationDto.tableId} not found`,
        );
      }

      if (newTable.status === TableStatus.MAINTENANCE) {
        throw new BadRequestException(
          `Table ${newTable.tableName} is currently under maintenance`,
        );
      }

      // Check if the party size exceeds new table capacity
      const partySize =
        updateTableReservationDto.partySize || reservation.partySize;
      if (partySize > newTable.capacity) {
        throw new BadRequestException(
          `Party size (${partySize}) exceeds table capacity (${newTable.capacity})`,
        );
      }
    }

    // If changing date or time, check for conflicts
    if (
      updateTableReservationDto.reservationDate ||
      updateTableReservationDto.reservationTime
    ) {
      const reservationDate =
        updateTableReservationDto.reservationDate ||
        format(reservation.reservationDate, 'yyyy-MM-dd');
      const reservationTime =
        updateTableReservationDto.reservationTime ||
        reservation.reservationTime;
      const tableId = updateTableReservationDto.tableId || reservation.tableId;

      // Validate date and time format
      const dateTimeString = `${reservationDate}T${reservationTime}`;
      const reservationDateTime = parseISO(dateTimeString);

      if (!isValid(reservationDateTime)) {
        throw new BadRequestException(
          'Invalid reservation date or time format',
        );
      }

      // Check if reservation is in the past
      const now = new Date();
      if (reservationDateTime < now) {
        throw new BadRequestException(
          'Reservation cannot be made for past dates',
        );
      }

      // Check for conflicting reservations (assuming 2-hour time slots)
      const reservationEndTime = addHours(reservationDateTime, 2);

      // We'll use the parsed date for filtering by date if needed
      const conflictingReservations =
        await this.tableReservationRepository.find({
          where: {
            tableId,
            status: ReservationStatus.CONFIRMED,
            id: Not(id), // Exclude current reservation
          },
        });

      // Check for time conflicts
      for (const conflictReservation of conflictingReservations) {
        const existingReservationTime = parseISO(
          `${conflictReservation.reservationDate.toISOString().split('T')[0]}T${conflictReservation.reservationTime}`,
        );
        const existingEndTime = addHours(existingReservationTime, 2);

        // Check if there's an overlap
        if (
          (reservationDateTime >= existingReservationTime &&
            reservationDateTime < existingEndTime) ||
          (reservationEndTime > existingReservationTime &&
            reservationEndTime <= existingEndTime) ||
          (reservationDateTime <= existingReservationTime &&
            reservationEndTime >= existingEndTime)
        ) {
          const table = await this.tableRepository.findOne({
            where: { id: tableId },
          });
          throw new BadRequestException(
            `Table ${table?.tableName || tableId} is already reserved at this time`,
          );
        }
      }
    }

    // Update the reservation
    await this.tableReservationRepository.update(id, updateTableReservationDto);

    const updatedReservation = await this.tableReservationRepository.findOne({
      where: { id },
      relations: ['table', 'user'],
    });

    if (!updatedReservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return new TableReservationResponseDto(updatedReservation);
  }

  /**
   * Cancel a reservation
   * @param id The reservation ID
   * @returns The cancelled reservation
   */
  async cancel(id: number): Promise<TableReservationResponseDto> {
    this.logger.log(`Cancelling reservation with ID: ${id}`);

    const reservation = await this.tableReservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    reservation.status = ReservationStatus.CANCELLED;
    await this.tableReservationRepository.save(reservation);

    return new TableReservationResponseDto(reservation);
  }

  /**
   * Confirm a reservation
   * @param id The reservation ID
   * @returns The confirmed reservation
   */
  async confirm(id: number): Promise<TableReservationResponseDto> {
    this.logger.log(`Confirming reservation with ID: ${id}`);

    const reservation = await this.tableReservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    reservation.status = ReservationStatus.CONFIRMED;
    await this.tableReservationRepository.save(reservation);

    return new TableReservationResponseDto(reservation);
  }

  /**
   * Mark a reservation as completed
   * @param id The reservation ID
   * @returns The completed reservation
   */
  async complete(id: number): Promise<TableReservationResponseDto> {
    this.logger.log(`Completing reservation with ID: ${id}`);

    const reservation = await this.tableReservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    reservation.status = ReservationStatus.COMPLETED;
    await this.tableReservationRepository.save(reservation);

    return new TableReservationResponseDto(reservation);
  }

  /**
   * Delete a reservation
   * @param id The reservation ID
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`Removing reservation with ID: ${id}`);

    const reservation = await this.tableReservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    await this.tableReservationRepository.remove(reservation);
  }
}
