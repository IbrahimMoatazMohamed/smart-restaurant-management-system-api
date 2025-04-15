import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CustomLoggerService } from '../logger/logger.service';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('AuthController');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been successfully logged in.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to login.',
  })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for user with email: ${loginDto.email}`);
    return await this.authService.login(loginDto);
  }

  /**
   * Create a new user
   *
   * @param createUserDto User creation data
   * @returns Created user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Handles the registration of a new user with the provided information.',
  })
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
  async register(@Body() createUserDto: CreateUserDto) {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);
    return await this.authService.register(createUserDto);
  }
}
