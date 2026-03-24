import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload sent by ebay-live-service when a live auction winner submits payment.
 * Set LIVE_ORDER_CALLBACK_URL in ebay-live-service to point to API Gateway → this endpoint.
 */
export class FromLiveAuctionDto {
  @ApiProperty({ example: 'live-auction' })
  @IsString()
  source: string;

  @ApiProperty({ example: 'auction_123' })
  @IsString()
  auctionId: string;

  @ApiProperty({ example: 42, description: 'Platform user ID (buyer)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 99.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'card' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'stream_abc' })
  @IsOptional()
  @IsString()
  streamId?: string;

  @ApiPropertyOptional({ example: 'Vintage Watch' })
  @IsOptional()
  @IsString()
  itemTitle?: string;
}
