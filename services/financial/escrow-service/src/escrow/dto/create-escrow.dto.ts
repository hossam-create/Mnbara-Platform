import { IsString, IsNumber, IsOptional, IsPositive, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEscrowDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  @MinLength(1)
  transactionId: string;

  @ApiProperty({ description: 'Buyer ID' })
  @IsString()
  @MinLength(1)
  buyerId: string;

  @ApiProperty({ description: 'Seller ID' })
  @IsString()
  @MinLength(1)
  sellerId: string;

  @ApiProperty({ description: 'Escrow amount' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Escrow description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Release conditions', required: false })
  @IsString()
  @IsOptional()
  releaseConditions?: string;
}
