import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransferDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  @IsNotEmpty()
  senderCountry: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  senderCurrency: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  sendAmount: number;

  @ApiProperty({ example: 'EG' })
  @IsString()
  @IsNotEmpty()
  recipientCountry: string;

  @ApiProperty({ example: 'EGP' })
  @IsString()
  @IsNotEmpty()
  recipientCurrency: string;

  @ApiPropertyOptional({ example: 'recipient-uuid-456' })
  @IsOptional()
  @IsString()
  recipientId?: string;
}

export class EstimateTransferDto {
  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  senderCurrency: string;

  @ApiProperty({ example: 'EGP' })
  @IsString()
  @IsNotEmpty()
  recipientCurrency: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(1)
  sendAmount: number;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  senderCountry?: string;

  @ApiPropertyOptional({ example: 'EG' })
  @IsOptional()
  @IsString()
  recipientCountry?: string;
}

export class CancelTransferDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ example: 'Changed my mind' })
  @IsOptional()
  @IsString()
  reason?: string;
}
