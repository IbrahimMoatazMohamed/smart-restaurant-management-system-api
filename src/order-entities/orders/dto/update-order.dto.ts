import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';

/**
 * UpdateOrderDto is created by extending PartialType of CreateOrderDto,
 * making all fields optional for updates.
 */
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
