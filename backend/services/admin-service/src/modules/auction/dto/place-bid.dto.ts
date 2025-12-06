import { IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';

export class PlaceBidDto {
  @IsNumber()
  listingId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsBoolean()
  isAutoBid?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number; // For proxy bidding
}
