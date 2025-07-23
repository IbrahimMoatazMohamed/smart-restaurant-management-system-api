import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CustomLoggerService } from '../logger/logger.service';

/**
 * Middleware to extract tenant ID from URL path
 * Expected URL format: /api/{tenantId}/...
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('TenantMiddleware');
  }
  /**
   * Validates if a client is active by checking with the Super Admin API
   * @param clientId The client/tenant ID to validate
   * @throws NotFoundException if client is not found or inactive
   */
  private async validateClientStatus(clientId: string): Promise<void> {
    try {
      const superAdminApiUrl =
        this.configService.get<string>('SUPER_ADMIN_API');
      if (!superAdminApiUrl) {
        this.logger.warn(
          'SUPER_ADMIN_API environment variable is not configured',
        );
        return;
      }

      const response = await axios.get(`${superAdminApiUrl}/clients/status`);
      const clientsStatus = response.data as Array<{
        clientId: number;
        status: boolean;
      }>;

      if (!Array.isArray(clientsStatus)) {
        this.logger.warn('Invalid response format from Super Admin API');
        return;
      }

      const clientStatus = clientsStatus.find(
        (client) => client.clientId === parseInt(clientId, 10),
      );

      if (!clientStatus) {
        this.logger.error(
          `Client with ID ${clientId} not found in status list`,
        );
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }

      if (!clientStatus.status) {
        this.logger.error(`Client with ID ${clientId} is inactive`);
        throw new ForbiddenException(`Client with ID ${clientId} is inactive`);
      }

      this.logger.log(
        `Validated client status for client ID ${clientId}: active`,
      );
    } catch (error) {
      this.logger.error(
        `Error validating client status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      throw error;
    }
  }
  async use(
    req: Request & { tenantId?: string },
    res: Response,
    next: NextFunction,
  ) {
    const urlParts = req.url.split('/');
    const tenantId = urlParts[2];

    if (!tenantId) {
      throw new BadRequestException('Missing tenant ID in URL');
    }

    try {
      await this.validateClientStatus(tenantId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        `Error validating client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      throw new InternalServerErrorException('Internal server error');
    }

    req.tenantId = tenantId;
    next();
  }
}
