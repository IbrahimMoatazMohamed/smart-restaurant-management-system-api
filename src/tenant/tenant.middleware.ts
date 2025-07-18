import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to extract tenant ID from URL path
 * Expected URL format: /api/{tenantId}/...
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { tenantId?: string }, res: Response, next: NextFunction) {
    const urlParts = req.url.split('/');
    const tenantId = urlParts[2];

    if (!tenantId) {
      throw new BadRequestException('Missing tenant ID in URL');
    }

    req.tenantId = tenantId;
    next();
  }
}
