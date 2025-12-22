import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbySearchDto {
  @ApiProperty({ description: 'Latitude', example: 25.1972 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude', example: 55.2744 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers', default: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  radiusKm?: number = 50;
}

export class UpdateLocationDto {
  @ApiProperty({ description: 'Traveler ID' })
  @Type(() => Number)
  @IsNumber()
  travelerId: number;

  @ApiProperty({ description: 'Latitude', example: 25.1972 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude', example: 55.2744 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @ApiPropertyOptional({ description: 'Country code', example: 'AE' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Nearest airport code', example: 'DXB' })
  @IsString()
  @IsOptional()
  airportCode?: string;
}

export class MatchOrderDto {
  @ApiProperty({ description: 'Order ID to match' })
  @Type(() => Number)
  @IsNumber()
  orderId: number;

  @ApiPropertyOptional({ description: 'Max pickup radius in km', default: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  maxPickupRadiusKm?: number = 50;

  @ApiPropertyOptional({ description: 'Max delivery radius in km', default: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  maxDeliveryRadiusKm?: number = 50;
}
