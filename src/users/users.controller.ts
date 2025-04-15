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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../logger/logger.service';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { AdminOnly } from '../auth/decorators/roles.decorator';

/**
 * Users Controller
 *
 * Handles user-related operations
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
  /**
   * Constructor
   *
   * Initializes the users service and custom logger
   */
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('UsersController');
  }

  /**
   * Create a new user
   *
   * @param createUserDto User creation data
   * @returns Created user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been successfully created.',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email or phone number already exists.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create user.',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);
    return await this.usersService.create(createUserDto);
  }

  /**
   * Get all users
   *
   * @returns List of all users
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all users.',
    type: [UserResponseDto],
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Admin role required.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve users.',
  })
  async findAll(): Promise<UserResponseDto[]> {
    this.logger.log('Retrieving all users');
    return await this.usersService.findAll();
  }

  /**
   * Get a user by ID
   *
   * @param id User ID
   * @returns User
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve user.',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Retrieving user with ID: ${id}`);
    return await this.usersService.findOne(+id);
  }

  /**
   * Update a user
   *
   * @param id User ID
   * @param updateUserDto User update data
   * @returns Updated user
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully updated.',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiConflictResponse({
    description: 'Phone number already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update user.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user with ID: ${id}`);
    return await this.usersService.update(+id, updateUserDto);
  }

  /**
   * Delete a user
   *
   * @param id User ID
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
  })
  @ApiForbiddenResponse({
    description: 'Access denied. Admin role required.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete user.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting user with ID: ${id}`);
    await this.usersService.remove(+id);
  }
}
