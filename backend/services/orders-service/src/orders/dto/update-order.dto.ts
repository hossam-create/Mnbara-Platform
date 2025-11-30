import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  PAID = 'PAID',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  estimatedDelivery?: Date;
}
