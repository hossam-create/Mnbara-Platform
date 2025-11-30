import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ example: 'New York' })
  @IsString()
  originCity: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  originCountry: string;

  @ApiPropertyOptional({ example: 'JFK' })
  @IsOptional()
  @IsString()
  originAirport?: string;

  @ApiProperty({ example: 'London' })
  @IsString()
  destCity: string;

  @ApiProperty({ example: 'UK' })
  @IsString()
  destCountry: string;

  @ApiPropertyOptional({ example: 'LHR' })
  @IsOptional()
  @IsString()
  destAirport?: string;

  @ApiProperty({ example: '2025-12-01T10:00:00Z' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ example: '2025-12-01T18:00:00Z' })
  @IsDateString()
  arrivalDate: string;

  @ApiProperty({ example: 20, description: 'Total weight capacity in kg' })
  @IsNumber()
  @Min(0)
  totalWeight: number;

  @ApiPropertyOptional({ example: 50, description: 'Total volume capacity in liters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalVolume?: number;

  @ApiProperty({ example: ['Electronics', 'Clothing', 'Books'] })
  @IsArray()
  @IsString({ each: true })
  allowedCategories: string[];

  @ApiProperty({ example: 15.99, description: 'Price per kg' })
  @IsNumber()
  @Min(0)
  pricePerKg: number;

  @ApiPropertyOptional({ example: 50, description: 'Base price for the trip' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'Can deliver to central London only' })
  @IsOptional()
  @IsString()
  notes?: string;
}
