/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CustomLoggerService } from '../../logger/logger.service';
import axios from 'axios';

@Injectable()
export class SuperAdminTokenGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('SuperAdminTokenGuard');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Super admin token is required');
    }

    try {
      const superAdminApiUrl =
        this.configService.get<string>('SUPER_ADMIN_API') +
        '/auth/validate-token';
      if (!superAdminApiUrl) {
        throw new UnauthorizedException('Super admin API is not configured');
      }

      this.logger.log(
        `Validating super admin token via API: ${superAdminApiUrl}`,
      );

      const response = await axios.post(superAdminApiUrl, { token });

      if (response.data && response.data.isValid === false) {
        throw new UnauthorizedException('Invalid super admin token');
      }

      if (!response.data || typeof response.data.isValid !== 'boolean') {
        this.logger.error(
          `Unexpected response format from super admin API: ${JSON.stringify(response.data)}`,
        );
        throw new UnauthorizedException('Invalid super admin token');
      }
      request['superAdminPayload'] = { role: 'super-admin' };
      return true;
    } catch (error) {
      this.logger.error(
        `Super admin token validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      throw new UnauthorizedException('Invalid super admin token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
