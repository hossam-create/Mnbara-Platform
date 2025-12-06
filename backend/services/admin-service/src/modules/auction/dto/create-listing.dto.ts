import { IsString, IsNumber, IsEnum, IsOptional, Min, IsDateString } from 'class-validator';

export enum ListingType {
  AUCTION = 'auction',
  BUY_NOW = 'buy_now',
  BOTH = 'both',
}

export class CreateListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  @Min(0.01)
  startingPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reservePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  buyNowPrice?: number;

  @IsEnum(ListingType)
  listingType: ListingType;

  @IsDateString()
  endTime: string; // ISO 8601 format
}
