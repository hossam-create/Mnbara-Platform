import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class WithdrawDto {
  @ApiProperty({ 
    example: 'user-123',
    description: 'User ID'
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    example: 'EGP',
    description: 'Currency to withdraw',
    enum: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY']
  })
  @IsEnum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'])
  currency: Currency;

  @ApiProperty({ 
    example: 50.25,
    description: 'Amount to withdraw',
    minimum: 0.01
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    example: 'withdrawal-ref-123',
    description: 'Reference ID for the withdrawal',
    required: false
  })
  @IsOptional()
  @IsString()
  referenceId?: string;
}
