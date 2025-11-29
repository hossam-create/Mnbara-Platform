import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeliveryType {
  CROWDSHIP = 'CROWDSHIP',
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

export class CreateOrderItemDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  productName: string;

  @ApiPropertyOptional({ example: 'https://amazon.com/product/123' })
  @IsOptional()
  @IsString()
  productUrl?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1299.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: DeliveryType, default: DeliveryType.CROWDSHIP })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ example: 'New York' })
  @IsString()
  pickupCity: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  pickupCountry: string;

  @ApiPropertyOptional({ example: '123 Main St, NY 10001' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  deliveryCity: string;

  @ApiProperty({ example: 'UK' })
  @IsString()
  deliveryCountry: string;

  @ApiPropertyOptional({ example: '456 Oxford St, London W1' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}
