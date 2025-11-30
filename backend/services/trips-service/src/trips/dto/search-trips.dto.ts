import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchTripsDto {
  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  originCountry?: string;

  @ApiPropertyOptional({ example: 'UK' })
  @IsOptional()
  @IsString()
  destCountry?: string;

  @ApiPropertyOptional({ example: '2025-12-01' })
  @IsOptional()
  @IsDateString()
  departureAfter?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  departureBefore?: string;

  @ApiPropertyOptional({ example: 5, description: 'Minimum available weight in kg' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
