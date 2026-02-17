import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class CreateTransferDto {
  @ApiProperty({
    example: 'user-123',
    description: 'Sender user ID',
  })
  @IsString()
  fromUserId: string;

  @ApiProperty({
    example: 'user-456',
    description: 'Receiver user ID',
  })
  @IsString()
  toUserId: string;

  @ApiProperty({
    example: 'USD',
    description: 'Source currency',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'],
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  fromCurrency: Currency;

  @ApiProperty({
    example: 'EGP',
    description: 'Target currency',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'],
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  toCurrency: Currency;

  @ApiProperty({
    example: 100.50,
    description: 'Amount to transfer',
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 'Payment for services',
    description: 'Optional note for the transfer',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
