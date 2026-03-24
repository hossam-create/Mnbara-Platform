import { IsOptional, IsEnum, IsString, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class PriceBreakdownDto {
  @IsNumber()
  itemPrice: number;
  @IsNumber()
  travelerFee: number;
  @IsNumber()
  serviceFee: number;
  @IsNumber()
  total: number;
  @IsString()
  currency: string;
}

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
  @IsString()
  assignedTravelerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceBreakdownDto)
  priceBreakdown?: PriceBreakdownDto;

  @ApiPropertyOptional()
  @IsOptional()
  estimatedDelivery?: Date;
}
