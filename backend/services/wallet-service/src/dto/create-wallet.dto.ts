import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class CreateWalletDto {
  @ApiProperty({ 
    example: 'user-123',
    description: 'User ID'
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    example: 'EGP',
    description: 'Primary currency for the wallet',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'],
    required: false
  })
  @IsOptional()
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  primaryCurrency?: Currency;
}
