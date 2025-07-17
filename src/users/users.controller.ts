import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  UploadedFile,
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
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../logger/logger.service';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminOnly } from '../auth/decorators/roles.decorator';
import { MeOrAdmin } from '../auth/decorators/me-or-admin.decorator';
import { ImageUpload } from '../file-upload/decorators/image-upload.decorator';
import { ImageUploadHelper } from '../file-upload/helpers/image-upload.helper';

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
    private readonly imageUploadHelper: ImageUploadHelper,
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
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
  async findOne(@MeOrAdmin() userId: number): Promise<UserResponseDto> {
    this.logger.log(`Retrieving user with ID: ${userId}`);
    return await this.usersService.findOne(userId);
  }

  /**
   * Update a user
   *
   * @param userId User ID
   * @param updateUserDto User update data
   * @returns Updated user
   */
  @Patch(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
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
    @MeOrAdmin() userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user with ID: ${userId}`);
    return await this.usersService.update(userId, updateUserDto);
  }

  /**
   * Delete a user
   *
   * @param userId User ID
   */
  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
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
  async remove(@MeOrAdmin() userId: number): Promise<void> {
    this.logger.log(`Deleting user with ID: ${userId}`);
    await this.usersService.remove(userId);
  }

  /**
   * Upload a profile image for a user
   *
   * @param userId User ID
   * @param file Image file
   * @returns Object with image URL
   */
  @Post(':userId/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a profile image' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image uploaded successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to upload profile image.',
  })
  @ImageUpload('')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update meal with optional image upload',
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfileImage(
    @MeOrAdmin() userId: number,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    this.logger.log(`Uploading profile image for user with ID: ${userId}`);
    const imageUrl = this.imageUploadHelper.extractImageUrl(photo);
    return await this.usersService.updateProfileImage(userId, imageUrl);
  }
}
