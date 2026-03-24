import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class ConvertDto {
  @ApiProperty({ 
    example: 'user-123',
    description: 'User ID'
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    example: 'USD',
    description: 'Source currency',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY']
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  fromCurrency: Currency;

  @ApiProperty({ 
    example: 'EGP',
    description: 'Target currency',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY']
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  toCurrency: Currency;

  @ApiProperty({ 
    example: 100,
    description: 'Amount to convert',
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
