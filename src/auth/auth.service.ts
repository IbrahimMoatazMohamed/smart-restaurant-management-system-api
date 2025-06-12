import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CustomLoggerService } from '../logger/logger.service';
import { handleError } from '../utils/error-handler.util';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { comparePasswords } from '../utils/password.util';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

interface UserWithoutPassword {
  id: number;
  email: string;
  name: string;
  role: string;
  [key: string]: any;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('AuthService');
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: passwordField, ...result } = user;
      return result;
    } catch (err) {
      return handleError(
        err,
        [UnauthorizedException],
        'Failed to validate user',
        () => {
          this.logger.logError(err, 'AuthService.validateUser', { email });
        },
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (err) {
      return handleError(
        err,
        [UnauthorizedException],
        'Failed to login',
        () => {
          this.logger.logError(err, 'AuthService.login', {
            email: loginDto.email,
          });
        },
      );
    }
  }

  async register(createUserDto: CreateUserDto) {
    createUserDto.role = 'user';
    return await this.usersService.create(createUserDto);
  }

  async adminLogin(adminLoginDto: AdminLoginDto) {
    try {
      const user = await this.validateUser(
        adminLoginDto.email,
        adminLoginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.role !== 'admin') {
        throw new ForbiddenException(
          'Access denied. Admin privileges required.',
        );
      }

      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    } catch (err) {
      return handleError(
        err,
        [UnauthorizedException, ForbiddenException],
        'Failed to login as admin',
        () => {
          this.logger.logError(err, 'AuthService.adminLogin', {
            email: adminLoginDto.email,
          });
        },
      );
    }
  }
}
