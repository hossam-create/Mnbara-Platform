import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreditWalletDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Wallet ID (UUID)',
  })
  @IsString()
  walletId: string;

  @ApiProperty({
    example: 100.50,
    description: 'Amount to credit (in major units, e.g., dollars, not cents)',
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 'PAYMENT_RECEIVED',
    description: 'Reason for credit',
    enum: [
      'PAYMENT_RECEIVED',
      'REFUND',
      'ESCROW_RELEASE',
      'ADMIN_ADJUSTMENT',
      'BONUS',
      'OTHER',
    ],
  })
  @IsEnum([
    'PAYMENT_RECEIVED',
    'REFUND',
    'ESCROW_RELEASE',
    'ADMIN_ADJUSTMENT',
    'BONUS',
    'OTHER',
  ])
  reason: string;

  @ApiProperty({
    example: 'payment',
    description: 'Reference type',
    enum: ['payment', 'order', 'escrow', 'transfer', 'adjustment', 'other'],
  })
  @IsEnum(['payment', 'order', 'escrow', 'transfer', 'adjustment', 'other'])
  referenceType: string;

  @ApiProperty({
    example: 'payment-123',
    description: 'Reference ID (e.g., payment ID, order ID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({
    example: 'Payment received for order #123',
    description: 'Human-readable description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'req-123-456',
    description: 'Idempotency key (optional, auto-generated if not provided)',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}

export class DebitWalletDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Wallet ID (UUID)',
  })
  @IsString()
  walletId: string;

  @ApiProperty({
    example: 50.25,
    description: 'Amount to debit (in major units, e.g., dollars, not cents)',
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 'PURCHASE',
    description: 'Reason for debit',
    enum: [
      'PURCHASE',
      'WITHDRAWAL',
      'ESCROW_LOCK',
      'FEE',
      'ADMIN_ADJUSTMENT',
      'OTHER',
    ],
  })
  @IsEnum([
    'PURCHASE',
    'WITHDRAWAL',
    'ESCROW_LOCK',
    'FEE',
    'ADMIN_ADJUSTMENT',
    'OTHER',
  ])
  reason: string;

  @ApiProperty({
    example: 'order',
    description: 'Reference type',
    enum: ['payment', 'order', 'escrow', 'transfer', 'adjustment', 'other'],
  })
  @IsEnum(['payment', 'order', 'escrow', 'transfer', 'adjustment', 'other'])
  referenceType: string;

  @ApiProperty({
    example: 'order-456',
    description: 'Reference ID (e.g., order ID, withdrawal ID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({
    example: 'Payment for order #456',
    description: 'Human-readable description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'req-789-012',
    description: 'Idempotency key (optional, auto-generated if not provided)',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestId?: string;
}
