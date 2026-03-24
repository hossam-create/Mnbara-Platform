import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class DepositDto {
  @ApiProperty({ 
    example: 'user-123',
    description: 'User ID'
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    example: 'EGP',
    description: 'Currency to deposit',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY']
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  currency: Currency;

  @ApiProperty({ 
    example: 100.50,
    description: 'Amount to deposit',
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    example: 'payment-ref-123',
    description: 'Reference ID for the deposit',
    required: false
  })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
